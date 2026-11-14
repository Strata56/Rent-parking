import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.payment import Payment
from models.booking import Booking
from models.parking_slot import ParkingSlot
from models.parking_lot import ParkingLot
from models.user import User
from utils.auth import get_current_user

router = APIRouter(prefix="/api/payment", tags=["Payments"])

def calculate_booking_amount(booking: Booking, db: Session) -> float:
    """Calculate server-side payment amount: hours x price_per_hour"""
    slot = db.query(ParkingSlot).filter(ParkingSlot.slot_id == booking.slot_id).first()
    lot = db.query(ParkingLot).filter(ParkingLot.lot_id == slot.lot_id).first() if slot else None
    price_per_hour = lot.price_per_hour if lot and lot.price_per_hour is not None else 50.0

    if booking.start_time and booking.end_time:
        duration_seconds = (booking.end_time - booking.start_time).total_seconds()
        hours = max(1.0, duration_seconds / 3600.0)
    else:
        hours = 2.0
    return round(hours * price_per_hour, 2)

class CreateOrderRequest(BaseModel):
    booking_id: str
    amount: Optional[float] = None
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
    
    server_amount = calculate_booking_amount(booking, db)
    order_id = f"order_{uuid.uuid4().hex[:14]}"
    return {
        "order_id": order_id,
        "amount": server_amount,
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

    # 1. Idempotency check: if payment already successfully verified for this booking, return existing record
    existing_payment = db.query(Payment).filter(
        Payment.booking_id == booking.booking_id,
        Payment.status == "SUCCESS"
    ).first()

    if existing_payment:
        if booking.status != "CONFIRMED":
            booking.status = "CONFIRMED"
            db.commit()
        return {
            "message": "Payment verified successfully",
            "payment_id": existing_payment.payment_id,
            "transaction_id": existing_payment.transaction_id,
            "status": existing_payment.status,
            "booking_id": booking.booking_id,
            "amount": existing_payment.amount
        }

    # Check if transaction_id was already recorded
    tx_id = data.transaction_id or data.payment_id
    if tx_id:
        existing_tx = db.query(Payment).filter(Payment.transaction_id == tx_id).first()
        if existing_tx:
            return {
                "message": "Payment verified successfully",
                "payment_id": existing_tx.payment_id,
                "transaction_id": existing_tx.transaction_id,
                "status": existing_tx.status,
                "booking_id": existing_tx.booking_id,
                "amount": existing_tx.amount
            }
    else:
        tx_id = f"pay_{uuid.uuid4().hex[:12]}"

    # 2. Server-side payment amount calculation: hours x price_per_hour
    amount = calculate_booking_amount(booking, db)
    
    payment = Payment(
        booking_id=booking.booking_id,
        amount=amount,
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
        "booking_id": booking.booking_id,
        "amount": payment.amount
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
