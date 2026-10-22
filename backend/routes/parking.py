from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models.parking_lot import ParkingLot
from models.parking_slot import ParkingSlot
from models.user import User
from utils.auth import get_current_user

router = APIRouter(prefix="/api/parking", tags=["Parking Lots & Slots"])

class CreateLotRequest(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int
    price_per_hour: float

class UpdateSlotStatusRequest(BaseModel):
    status: str

@router.get("/lots")
def get_parking_lots(
    q: Optional[str] = None,
    slot_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ParkingLot)
    if q:
        search_filter = f"%{q}%"
        query = query.filter((ParkingLot.name.ilike(search_filter)) | (ParkingLot.address.ilike(search_filter)))
    
    lots = query.all()
    results = []
    for lot in lots:
        slot_query = db.query(ParkingSlot).filter(
            ParkingSlot.lot_id == lot.lot_id,
            ParkingSlot.status == "AVAILABLE"
        )
        if slot_type:
            slot_query = slot_query.filter(ParkingSlot.slot_type == slot_type.upper())
        available_count = slot_query.count()

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

@router.get("/lots/{lot_id}")
def get_parking_lot_by_id(lot_id: str, db: Session = Depends(get_db)):
    lot = db.query(ParkingLot).filter(ParkingLot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    slots = db.query(ParkingSlot).filter(ParkingSlot.lot_id == lot_id).order_by(ParkingSlot.slot_number).all()
    available_count = sum(1 for s in slots if s.status == "AVAILABLE")

    return {
        "lot_id": lot.lot_id,
        "operator_id": lot.operator_id,
        "name": lot.name,
        "address": lot.address,
        "latitude": lot.latitude,
        "longitude": lot.longitude,
        "total_slots": lot.total_slots,
        "price_per_hour": lot.price_per_hour,
        "available_slots": available_count,
        "slots": [
            {
                "slot_id": s.slot_id,
                "lot_id": s.lot_id,
                "slot_number": s.slot_number,
                "slot_type": s.slot_type,
                "status": s.status
            }
            for s in slots
        ]
    }

@router.post("/lots")
def create_parking_lot(
    data: CreateLotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = ParkingLot(
        operator_id=current_user.user_id,
        name=data.name,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        total_slots=data.total_slots,
        price_per_hour=data.price_per_hour
    )
    db.add(lot)
    db.commit()
    db.refresh(lot)

    # Automatically generate initial parking slots
    slots = []
    for i in range(1, data.total_slots + 1):
        slot_type = "CAR"
        if i % 6 == 0:
            slot_type = "EV"
        elif i % 4 == 0:
            slot_type = "BIKE"
        elif i == 1:
            slot_type = "ACCESSIBLE"
        
        row_letter = chr(65 + (i - 1) // 8)
        num = ((i - 1) % 8) + 1
        slot = ParkingSlot(
            lot_id=lot.lot_id,
            slot_number=f"{row_letter}-{num:02d}",
            slot_type=slot_type,
            status="AVAILABLE"
        )
        slots.append(slot)
    
    db.add_all(slots)
    db.commit()

    return {
        "message": "Parking lot created successfully",
        "lot_id": lot.lot_id,
        "name": lot.name,
        "total_slots": lot.total_slots
    }

@router.get("/slots/{lot_id}")
def get_slots_by_lot(lot_id: str, db: Session = Depends(get_db)):
    slots = db.query(ParkingSlot).filter(ParkingSlot.lot_id == lot_id).order_by(ParkingSlot.slot_number).all()
    return [
        {
            "slot_id": s.slot_id,
            "lot_id": s.lot_id,
            "slot_number": s.slot_number,
            "slot_type": s.slot_type,
            "status": s.status
        }
        for s in slots
    ]

@router.patch("/slots/{slot_id}/status")
def update_slot_status(
    slot_id: str,
    data: UpdateSlotStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    slot.status = data.status.upper()
    db.commit()
    return {
        "message": "Slot status updated",
        "slot_id": slot.slot_id,
        "status": slot.status
    }
