import uuid
from sqlalchemy import Column, String, Integer, Float
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ParkingLot(Base):
    __tablename__ = "parking_lots"

    lot_id = Column(String(36), primary_key=True, default=generate_uuid)
    operator_id = Column(String(36), nullable=True) # ID of the managing operator
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_slots = Column(Integer, default=0)
    price_per_hour = Column(Float, default=50.0)

    # Relationships
    slots = relationship("ParkingSlot", back_populates="lot", cascade="all, delete-orphan")
