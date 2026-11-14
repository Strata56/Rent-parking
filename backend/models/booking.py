import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(String(36), ForeignKey("parking_slots.slot_id"), nullable=False)
    vehicle_id = Column(String(36), ForeignKey("vehicles.vehicle_id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(30), default="CONFIRMED") # CONFIRMED, ACTIVE, COMPLETED, CANCELLED, EXPIRED
    qr_code = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    arrival_deadline = Column(DateTime, nullable=True) # Time window within which vehicle must be parked/scanned
    extended_count = Column(Integer, default=0) # Number of grace extensions granted (max 1)

    # Relationships
    user = relationship("User", back_populates="bookings")
    slot = relationship("ParkingSlot", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    entry_exit_logs = relationship("EntryExitLog", back_populates="booking", cascade="all, delete-orphan")
