import pytest
import uuid
from database import SessionLocal
from models.payment import Payment
from models.booking import Booking

def test_payment_creation():
    db = SessionLocal()
    try:
        booking = db.query(Booking).first()
        if not booking:
            return
        
        tx_id = f"pay_{uuid.uuid4().hex[:12]}"
        payment = Payment(
            booking_id=booking.booking_id,
            amount=120.0,
            gateway="RAZORPAY",
            transaction_id=tx_id,
            status="SUCCESS"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        assert payment.payment_id is not None
        assert payment.amount == 120.0
        assert payment.status == "SUCCESS"
        db.delete(payment)
        db.commit()
    finally:
        db.close()
