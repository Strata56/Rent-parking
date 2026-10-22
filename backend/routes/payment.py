import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.payment import Payment
from models.booking import Booking
from models.user import User
from utils.auth import get_current_user

router = APIRouter(prefix="/api/payment", tags=["Payments"])

class CreateOrderRequest(BaseModel):
    booking_id: str
    amount: float
    gateway: Optional[str] = "RAZORPAY"

class VerifyPaymentRequest(BaseModel):
    booking_id: str
    payment_id: Optional[str] = None
    transaction_id: Optional[str] = None
    gateway: Optional[str] = "RAZORPAY"

@router.post("/create-order")
def create_payment_order(
    data: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    order_id = f"order_{uuid.uuid4().hex[:14]}"
    return {
        "order_id": order_id,
        "amount": data.amount,
        "currency": "INR",
        "booking_id": booking.booking_id,
        "key_id": "rzp_test_mockkey123"
    }

@router.post("/verify")
def verify_payment(
    data: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.booking_id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    tx_id = data.transaction_id or data.payment_id or f"pay_{uuid.uuid4().hex[:12]}"
    
    payment = Payment(
        booking_id=booking.booking_id,
        amount=100.0, # default simulated fee or resolved
        gateway=data.gateway or "RAZORPAY",
        transaction_id=tx_id,
        status="SUCCESS",
        paid_at=datetime.now(timezone.utc)
    )
    booking.status = "CONFIRMED"
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment verified successfully",
        "payment_id": payment.payment_id,
        "transaction_id": payment.transaction_id,
        "status": payment.status,
        "booking_id": booking.booking_id
    }

@router.get("/history")
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query payments for user's bookings
    payments = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.booking_id)
        .filter(Booking.user_id == current_user.user_id)
        .order_by(Payment.paid_at.desc())
        .all()
    )
    return [
        {
            "payment_id": p.payment_id,
            "booking_id": p.booking_id,
            "amount": p.amount,
            "gateway": p.gateway,
            "transaction_id": p.transaction_id,
            "status": p.status,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None
        }
        for p in payments
    ]
