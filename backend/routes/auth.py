from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models.user import User
from models.vehicle import Vehicle
from models.booking import Booking
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
vehicle_router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "driver"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str

class VehicleCreateRequest(BaseModel):
    license_plate: str
    vehicle_type: Optional[str] = "Car"
    make_model: Optional[str] = None

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    assigned_role = data.role if data.role in ["driver", "commuter", "operator"] else "driver"
    new_user = User(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=assigned_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.user_id, "role": new_user.role, "email": new_user.email})
    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "phone": new_user.phone,
            "role": new_user.role
        }
    }

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": user.user_id, "role": user.role, "email": user.email})
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role
    }

# ----------------- Vehicle Management Endpoints ----------------- #

@vehicle_router.get("")
def list_user_vehicles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == current_user.user_id).all()
    return [
        {
            "vehicle_id": v.vehicle_id,
            "user_id": v.user_id,
            "license_plate": v.license_plate,
            "vehicle_type": v.vehicle_type,
            "make_model": v.make_model
        }
        for v in vehicles
    ]

@vehicle_router.post("")
def add_user_vehicle(data: VehicleCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plate = data.license_plate.strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="License plate is required")
        
    existing = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.user_id,
        Vehicle.license_plate == plate
    ).first()
    
    if existing:
        return {
            "message": "Vehicle already registered",
            "vehicle_id": existing.vehicle_id,
            "license_plate": existing.license_plate,
            "vehicle_type": existing.vehicle_type,
            "make_model": existing.make_model
        }
    
    vehicle = Vehicle(
        user_id=current_user.user_id,
        license_plate=plate,
        vehicle_type=data.vehicle_type or "Car",
        make_model=data.make_model or "Personal Vehicle"
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle registered successfully in database",
        "vehicle_id": vehicle.vehicle_id,
        "license_plate": vehicle.license_plate,
        "vehicle_type": vehicle.vehicle_type,
        "make_model": vehicle.make_model
    }

@vehicle_router.delete("/{vehicle_id}")
def delete_user_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id,
        Vehicle.user_id == current_user.user_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if there are active bookings for this vehicle
    active_booking = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_(["ACTIVE", "CONFIRMED"])
    ).first()
    if active_booking:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove vehicle: It is assigned to an active or confirmed parking reservation."
        )

    try:
        # Delete any associated completed or cancelled bookings first
        related_bookings = db.query(Booking).filter(Booking.vehicle_id == vehicle_id).all()
        for b in related_bookings:
            db.delete(b)
        db.flush()
        db.delete(vehicle)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Unable to remove vehicle: {str(e)}"
        )
    return {"message": "Vehicle removed successfully", "vehicle_id": vehicle_id}
