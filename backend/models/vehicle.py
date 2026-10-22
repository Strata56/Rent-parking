import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    license_plate = Column(String(40), index=True, nullable=False)
    vehicle_type = Column(String(30), default="Car") # Car, Bike, SUV, EV
    make_model = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle", cascade="all, delete-orphan")
