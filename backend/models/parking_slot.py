import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    slot_id = Column(String(36), primary_key=True, default=generate_uuid)
    lot_id = Column(String(36), ForeignKey("parking_lots.lot_id", ondelete="CASCADE"), nullable=False)
    slot_number = Column(String(20), nullable=False)
    slot_type = Column(String(30), default="CAR") # CAR, BIKE, EV, ACCESSIBLE
    status = Column(String(30), default="AVAILABLE") # AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE

    # Relationships
    lot = relationship("ParkingLot", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")
