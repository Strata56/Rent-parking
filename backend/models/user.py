import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="driver") # 'driver' or 'operator'
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
