from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, Base
import models # imports all models so SQLAlchemy registers them

# Import routes
from routes.auth import router as auth_router, vehicle_router
from routes.parking import router as parking_router
from routes.booking import router as booking_router
from routes.payment import router as payment_router
from routes.qr import router as qr_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartPark",
    description="SmartPark - Real-Time Parking & Cashless Reservation System",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(parking_router)
# Alias for /api/lots if requested directly
app.include_router(parking_router, prefix="/api/lots", tags=["Parking Lots Alias"])
app.include_router(booking_router)
app.include_router(payment_router)
app.include_router(qr_router)

@app.get("/")
def home():
    return {
        "project": "Smart Parking & Vehicle Management System",
        "status": "Online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Smart Parking API"}

# Auto-seed database with default facilities, vehicles and demo users if empty
def seed_initial_data():
    from models.user import User
    from models.vehicle import Vehicle
    from models.parking_lot import ParkingLot
    from models.parking_slot import ParkingSlot
    from utils.auth import hash_password

    db = SessionLocal()
    try:
        # Check if users already exist
        demo_user = db.query(User).filter(User.email == "sarthak@example.com").first()
        if not demo_user:
            demo_user = User(
                name="Sarthak Kambli",
                email="sarthak@example.com",
                phone="+91 9820011223",
                password_hash=hash_password("user123"),
                role="driver"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

        demo_op = db.query(User).filter(User.email == "operator@parking.com").first()
        if not demo_op:
            demo_op = User(
                name="Chief Parking Operator",
                email="operator@parking.com",
                phone="+91 9820099887",
                password_hash=hash_password("operator123"),
                role="operator"
            )
            db.add(demo_op)
            db.commit()


        # Check if parking lots already exist
        if not db.query(ParkingLot).first():
            lots_data = [
                {
                    "name": "BKC Tech Park Gateway Plaza",
                    "address": "BKC Central Road, Bandra East, Mumbai",
                    "latitude": 19.0657,
                    "longitude": 72.8687,
                    "total_slots": 24,
                    "price_per_hour": 60.0
                },
                {
                    "name": "City Center Metro Hub",
                    "address": "Station Access Way, Andheri West, Mumbai",
                    "latitude": 19.1197,
                    "longitude": 72.8468,
                    "total_slots": 20,
                    "price_per_hour": 40.0
                },
                {
                    "name": "Airport Terminal 2 Express Lot",
                    "address": "Sahar Elevated Access Road, Mumbai Airport",
                    "latitude": 19.0968,
                    "longitude": 72.8748,
                    "total_slots": 28,
                    "price_per_hour": 120.0
                },
                {
                    "name": "Phoenix Lifestyle Mall Garage",
                    "address": "LBS Marg, Kurla West, Mumbai",
                    "latitude": 19.0860,
                    "longitude": 72.8890,
                    "total_slots": 24,
                    "price_per_hour": 50.0
                }
            ]

            for data in lots_data:
                lot = ParkingLot(
                    name=data["name"],
                    address=data["address"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    total_slots=data["total_slots"],
                    price_per_hour=data["price_per_hour"]
                )
                db.add(lot)
                db.commit()
                db.refresh(lot)

                # Generate slots
                slots = []
                for i in range(1, data["total_slots"] + 1):
                    slot_type = "CAR"
                    if i % 6 == 0:
                        slot_type = "EV"
                    elif i % 4 == 0:
                        slot_type = "BIKE"
                    elif i == 1:
                        slot_type = "ACCESSIBLE"

                    row = chr(65 + (i - 1) // 8)
                    num = ((i - 1) % 8) + 1
                    status = "OCCUPIED" if (i % 7 == 0) else "AVAILABLE"
                    slots.append(ParkingSlot(
                        lot_id=lot.lot_id,
                        slot_number=f"{row}-{num:02d}",
                        slot_type=slot_type,
                        status=status
                    ))
                db.add_all(slots)
                db.commit()
    except Exception as e:
        print(f"Seed note: {e}")
        db.rollback()
    finally:
        db.close()

seed_initial_data()
