from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.booking import Booking
from models.parking_slot import ParkingSlot
from models.parking_lot import ParkingLot
from models.entry_exit_log import EntryExitLog
from models.user import User
from utils.auth import get_current_user
from utils.qr_generator import generate_qr_base64

router = APIRouter(prefix="/api/qr", tags=["QR Code & Barrier Terminal"])

class QRScanRequest(BaseModel):
    qr_code: str
    action: Optional[str] = "ENTRY" # 'ENTRY' or 'EXIT'
    method: Optional[str] = "QR_CODE" # 'QR_CODE' or 'ANPR'

@router.post("/scan")
def scan_qr_barrier(
    data: QRScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Operator access required"
        )

    # Look up booking by QR token
    booking = db.query(Booking).filter(Booking.qr_code == data.qr_code.strip()).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid QR code. No corresponding booking found.")
    
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == booking.slot_id).first()
    lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first() if slot else None

    # Verify that the slot belongs to this operator's facility
    if lot and lot.operator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not manage the parking facility for this reservation"
        )
    
    now = datetime.now(timezone.utc)
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == booking.slot_id).first()

    action_type = data.action.upper()
    if action_type == "ENTRY":
        if booking.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot enter: Reservation was cancelled")
        if booking.status == "EXPIRED":
            raise HTTPException(status_code=400, detail="Cannot enter: Arrival window expired. Slot was released for no-show.")
        if booking.status == "COMPLETED":
            raise HTTPException(status_code=400, detail="Cannot enter: This reservation pass has already been completed.")
        
        # Check if arrival window has elapsed
        if booking.status == "CONFIRMED" and booking.arrival_deadline:
            deadline = booking.arrival_deadline
            curr_now = datetime.now(timezone.utc) if deadline.tzinfo is not None else datetime.utcnow()
            if curr_now > deadline:
                booking.status = "EXPIRED"
                if slot and slot.status == "RESERVED":
                    slot.status = "AVAILABLE"
                db.commit()
                raise HTTPException(
                    status_code=400,
                    detail="Cannot enter: Arrival window expired. You were required to park within the allocated time. Slot has been released."
                )
        
        booking.status = "ACTIVE"
        if slot:
            slot.status = "OCCUPIED"

        # Log entry
        log = EntryExitLog(
            booking_id=booking.booking_id,
            entry_time=now,
            verification_method=data.method or "QR_CODE"
        )
        db.add(log)
        db.commit()

        # Extract vehicle and driver metadata for the gate terminal display
        driver_name = booking.user.name if booking.user else "Registered Driver"
        vehicle_plate = booking.vehicle.license_plate if booking.vehicle else "N/A"
        vehicle_model = booking.vehicle.make_model if booking.vehicle else ""
        lot_name = slot.lot.name if (slot and slot.lot) else "Smart Parking Facility"

        return {
            "success": True,
            "message": "Entry approved. Barrier opening...",
            "action": "ENTRY",
            "slot_number": slot.slot_number if slot else "N/A",
            "booking_id": booking.booking_id,
            "driver_name": driver_name,
            "license_plate": vehicle_plate,
            "vehicle_model": vehicle_model,
            "lot_name": lot_name,
            "timestamp": now.isoformat()
        }
    else:
        # Exit action
        booking.status = "COMPLETED"
        if slot:
            slot.status = "AVAILABLE"

        # Update latest log or create exit entry
        log = (
            db.query(EntryExitLog)
            .filter(EntryExitLog.booking_id == booking.booking_id)
            .order_by(EntryExitLog.entry_time.desc())
            .first()
        )
        if log:
            log.exit_time = now
        else:
            log = EntryExitLog(
                booking_id=booking.booking_id,
                exit_time=now,
                verification_method=data.method or "QR_CODE"
            )
            db.add(log)
        
        db.commit()

        driver_name = booking.user.name if booking.user else "Registered Driver"
        vehicle_plate = booking.vehicle.license_plate if booking.vehicle else "N/A"
        vehicle_model = booking.vehicle.make_model if booking.vehicle else ""
        lot_name = slot.lot.name if (slot and slot.lot) else "Smart Parking Facility"

        return {
            "success": True,
            "message": "Exit approved. Have a safe journey!",
            "action": "EXIT",
            "slot_number": slot.slot_number if slot else "N/A",
            "booking_id": booking.booking_id,
            "driver_name": driver_name,
            "license_plate": vehicle_plate,
            "vehicle_model": vehicle_model,
            "lot_name": lot_name,
            "timestamp": now.isoformat()
        }

@router.get("/image/{booking_id}")
def get_qr_image(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    qr_data_uri = generate_qr_base64(booking.qr_code)
    return {
        "booking_id": booking.booking_id,
        "qr_code": booking.qr_code,
        "qr_image": qr_data_uri
    }
