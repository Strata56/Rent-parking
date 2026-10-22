import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    gateway = Column(String(50), default="RAZORPAY") # RAZORPAY, UPI, CARD
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(30), default="SUCCESS") # SUCCESS, PENDING, FAILED
    paid_at = Column(DateTime, default=get_utc_now)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
