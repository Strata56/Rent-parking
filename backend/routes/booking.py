import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.booking import Booking
from models.parking_slot import ParkingSlot
from models.parking_lot import ParkingLot
from models.vehicle import Vehicle
from models.user import User
from utils.auth import get_current_user

router = APIRouter(prefix="/api/booking", tags=["Bookings"])

class CreateBookingRequest(BaseModel):
    slot_id: str
    vehicle_id: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_type: Optional[str] = "Car"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_hours: Optional[int] = 2

def check_vehicle_slot_compatibility(vehicle_type: str, slot_type: str) -> bool:
    v = (vehicle_type or "Car").strip().upper()
    s = (slot_type or "CAR").strip().upper()
    if "BIKE" in v or "TWO-WHEELER" in v or "SCOOTER" in v or "MOTORCYCLE" in v:
        return s == "BIKE"
    if v == "EV" or "ELECTRIC" in v:
        return s == "EV"
    if v in ["CAR", "SUV", "SEDAN", "HATCHBACK"]:
        return s in ["CAR", "ACCESSIBLE"]
    return v == s

@router.post("")
@router.post("/create")
def create_booking(
    data: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify slot availability
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == data.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")
    
    if slot.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail=f"Slot is currently {slot.status}")
    
    # Resolve or create vehicle
    vehicle_id = data.vehicle_id
    vehicle_obj = None
    if vehicle_id:
        vehicle_obj = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()

    if not vehicle_obj:
        plate = data.license_plate or f"MH-02-EX-{uuid.uuid4().hex[:4].upper()}"
        vehicle_obj = db.query(Vehicle).filter(
            Vehicle.user_id == current_user.user_id,
            Vehicle.license_plate == plate
        ).first()
        if not vehicle_obj:
            vehicle_obj = Vehicle(
                user_id=current_user.user_id,
                license_plate=plate,
                vehicle_type=data.vehicle_type or "Car"
            )
            db.add(vehicle_obj)
            db.commit()
            db.refresh(vehicle_obj)
    
    vehicle_id = vehicle_obj.vehicle_id
    vehicle_type = vehicle_obj.vehicle_type or data.vehicle_type or "Car"

    # Enforce vehicle type vs slot type matching restriction
    if not check_vehicle_slot_compatibility(vehicle_type, slot.slot_type):
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle mismatch: Cannot reserve a {slot.slot_type} slot for a {vehicle_type}. Please select a matching {vehicle_type} bay."
        )

    # Compute start & end time
    now = datetime.now(timezone.utc)
    hours = data.duration_hours or 2
    from datetime import timedelta
    end = now + timedelta(hours=hours)

    qr_token = f"SP-{uuid.uuid4().hex[:12].upper()}"

    booking = Booking(
        user_id=current_user.user_id,
        slot_id=slot.slot_id,
        vehicle_id=vehicle_id,
        start_time=now,
        end_time=end,
        status="CONFIRMED",
        qr_code=qr_token
    )
    # Reserve slot
    slot.status = "RESERVED"
    
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Get lot info for price calculation
    lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first()
    rate = lot.price_per_hour if lot else 50.0
    total_amount = rate * hours

    return {
        "message": "Booking confirmed",
        "booking_id": booking.booking_id,
        "slot_number": slot.slot_number,
        "lot_name": lot.name if lot else "Parking Lot",
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "qr_code": booking.qr_code,
        "status": booking.status,
        "total_amount": total_amount
    }

@router.get("/my-bookings")
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.user_id).order_by(Booking.created_at.desc()).all()
    results = []
    for b in bookings:
        slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == b.slot_id).first()
        lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first() if slot else None
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == b.vehicle_id).first()
        
        results.append({
            "booking_id": b.booking_id,
            "slot_id": b.slot_id,
            "slot_number": slot.slot_number if slot else "N/A",
            "slot_type": slot.slot_type if slot else "CAR",
            "lot_name": lot.name if lot else "N/A",
            "lot_address": lot.address if lot else "N/A",
            "vehicle_plate": vehicle.license_plate if vehicle else "N/A",
            "start_time": b.start_time.isoformat() if b.start_time else None,
            "end_time": b.end_time.isoformat() if b.end_time else None,
            "status": b.status,
            "qr_code": b.qr_code,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results

@router.get("/all")
def get_all_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    results = []
    for b in bookings:
        slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == b.slot_id).first()
        lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first() if slot else None
        user = db.query(User).filter(User.user_id == b.user_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == b.vehicle_id).first()
        
        results.append({
            "booking_id": b.booking_id,
            "user_name": user.name if user else "Unknown",
            "slot_number": slot.slot_number if slot else "N/A",
            "lot_name": lot.name if lot else "N/A",
            "license_plate": vehicle.license_plate if vehicle else "N/A",
            "start_time": b.start_time.isoformat() if b.start_time else None,
            "end_time": b.end_time.isoformat() if b.end_time else None,
            "status": b.status,
            "qr_code": b.qr_code
        })
    return results

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.user_id and current_user.role != "operator":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    booking.status = "CANCELLED"
    # Free slot
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == booking.slot_id).first()
    if slot:
        slot.status = "AVAILABLE"
    
    db.commit()
    return {"message": "Booking cancelled successfully", "booking_id": booking_id}
