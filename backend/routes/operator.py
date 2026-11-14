from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models.user import User
from models.parking_lot import ParkingLot
from models.parking_slot import ParkingSlot
from models.booking import Booking
from models.payment import Payment
from models.vehicle import Vehicle
from utils.auth import get_current_user
from routes.booking import auto_expire_overdue_bookings, to_utc_iso

router = APIRouter(prefix="/api/operator", tags=["Operator Console"])

def verify_operator_role(current_user: User):
    """Enforces that the authenticated user has the 'operator' role, returning 403 otherwise."""
    if not current_user or current_user.role != "operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Operator access required"
        )

@router.get("/stats")
def get_operator_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns today's revenue from SUCCESS payments for this operator's lots,
    along with facility capacity and live occupancy stats.
    Restricted to operators only (returns 403 to drivers).
    """
    verify_operator_role(current_user)
    auto_expire_overdue_bookings(db)

    # 1. Lots owned by this operator
    lots = db.query(ParkingLot).filter(ParkingLot.operator_id == current_user.user_id).all()
    lot_ids = [lot.lot_id for lot in lots]

    if not lot_ids:
        return {
            "today_revenue": 0.0,
            "total_lots": 0,
            "total_slots": 0,
            "available_slots": 0,
            "occupied_slots": 0,
            "occupancy_rate": 0,
            "active_bookings": 0
        }

    # 2. Today's start in UTC
    now_utc = datetime.now(timezone.utc)
    today_start_aware = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start_naive = today_start_aware.replace(tzinfo=None)

    # 3. Sum SUCCESS payments for this operator's lots paid today
    payments = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.booking_id)
        .join(ParkingSlot, Booking.slot_id == ParkingSlot.slot_id)
        .filter(
            ParkingSlot.lot_id.in_(lot_ids),
            Payment.status == "SUCCESS"
        )
        .all()
    )

    today_revenue = 0.0
    for p in payments:
        if p.paid_at:
            # Handle both timezone-aware and timezone-naive timestamps in SQLite
            if p.paid_at.tzinfo:
                if p.paid_at >= today_start_aware:
                    today_revenue += (p.amount or 0.0)
            else:
                if p.paid_at >= today_start_naive:
                    today_revenue += (p.amount or 0.0)

    # 4. Total slots & slot states
    slots = db.query(ParkingSlot).filter(ParkingSlot.lot_id.in_(lot_ids)).all()
    total_slots = len(slots)
    available_slots = sum(1 for s in slots if s.status == "AVAILABLE")
    occupied_slots = sum(1 for s in slots if s.status in ["OCCUPIED", "RESERVED"])
    occupancy_rate = round((occupied_slots / total_slots) * 100) if total_slots > 0 else 0

    # 5. Active bookings
    active_bookings = (
        db.query(Booking)
        .join(ParkingSlot, Booking.slot_id == ParkingSlot.slot_id)
        .filter(
            ParkingSlot.lot_id.in_(lot_ids),
            Booking.status.in_(["CONFIRMED", "ACTIVE"])
        )
        .count()
    )

    return {
        "today_revenue": round(today_revenue, 2),
        "total_lots": len(lots),
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "occupancy_rate": occupancy_rate,
        "active_bookings": active_bookings
    }

@router.get("/lots")
def get_operator_lots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all parking lots managed by the authenticated operator.
    Restricted to operators only (returns 403 to drivers).
    """
    verify_operator_role(current_user)
    auto_expire_overdue_bookings(db)

    lots = db.query(ParkingLot).filter(ParkingLot.operator_id == current_user.user_id).all()
    results = []
    for lot in lots:
        available_count = db.query(ParkingSlot).filter(
            ParkingSlot.lot_id == lot.lot_id,
            ParkingSlot.status == "AVAILABLE"
        ).count()

        results.append({
            "lot_id": lot.lot_id,
            "operator_id": lot.operator_id,
            "name": lot.name,
            "address": lot.address,
            "latitude": lot.latitude,
            "longitude": lot.longitude,
            "total_slots": lot.total_slots,
            "price_per_hour": lot.price_per_hour,
            "available_slots": available_count
        })
    return results

@router.get("/bookings")
def get_operator_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all bookings across facilities managed by the authenticated operator.
    Restricted to operators only (returns 403 to drivers).
    """
    verify_operator_role(current_user)
    auto_expire_overdue_bookings(db)

    bookings = (
        db.query(Booking)
        .join(ParkingSlot, Booking.slot_id == ParkingSlot.slot_id)
        .join(ParkingLot, ParkingSlot.lot_id == ParkingLot.lot_id)
        .filter(ParkingLot.operator_id == current_user.user_id)
        .order_by(Booking.created_at.desc())
        .limit(100)
        .all()
    )

    results = []
    for b in bookings:
        slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == b.slot_id).first()
        lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first() if slot else None
        user = db.query(User).filter(User.user_id == b.user_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == b.vehicle_id).first()

        results.append({
            "booking_id": b.booking_id,
            "user_name": user.name if user else "Driver",
            "slot_number": slot.slot_number if slot else "N/A",
            "lot_name": lot.name if lot else "N/A",
            "license_plate": vehicle.license_plate if vehicle else "N/A",
            "start_time": to_utc_iso(b.start_time),
            "end_time": to_utc_iso(b.end_time),
            "arrival_deadline": to_utc_iso(b.arrival_deadline),
            "extended_count": b.extended_count or 0,
            "status": b.status,
            "qr_code": b.qr_code,
            "created_at": to_utc_iso(b.created_at)
        })
    return results
