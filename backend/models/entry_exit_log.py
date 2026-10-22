import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class EntryExitLog(Base):
    __tablename__ = "entry_exit_logs"

    log_id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False)
    entry_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True)
    verification_method = Column(String(40), default="QR_CODE") # QR_CODE or ANPR

    # Relationships
    booking = relationship("Booking", back_populates="entry_exit_logs")
