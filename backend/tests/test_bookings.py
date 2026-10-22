import pytest
import uuid
from datetime import datetime, timezone, timedelta
from database import SessionLocal, Base, engine
from models.parking_lot import ParkingLot
from models.parking_slot import ParkingSlot
from models.user import User
from models.vehicle import Vehicle
from models.booking import Booking

def setup_module():
    Base.metadata.create_all(bind=engine)

def test_booking_and_cancel_flow():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        slot = db.query(ParkingSlot).filter(ParkingSlot.status == "AVAILABLE").first()
        assert user is not None
        assert slot is not None

        start = datetime.now(timezone.utc)
        end = start + timedelta(hours=2)

        vehicle = db.query(Vehicle).filter(Vehicle.user_id == user.user_id).first()
        if not vehicle:
            vehicle = Vehicle(user_id=user.user_id, license_plate=f"MH-{uuid.uuid4().hex[:6].upper()}")
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)

        token = f"SP-{uuid.uuid4().hex[:12].upper()}"
        booking = Booking(
            user_id=user.user_id,
            slot_id=slot.slot_id,
            vehicle_id=vehicle.vehicle_id,
            start_time=start,
            end_time=end,
            status="CONFIRMED",
            qr_code=token
        )
        slot.status = "RESERVED"
        db.add(booking)
        db.commit()
        db.refresh(booking)

        assert booking.status == "CONFIRMED"
        assert slot.status == "RESERVED"

        # Cancel flow
        booking.status = "CANCELLED"
        slot.status = "AVAILABLE"
        db.delete(booking)
        db.commit()

        db.refresh(slot)
        assert slot.status == "AVAILABLE"
    finally:
        db.close()
