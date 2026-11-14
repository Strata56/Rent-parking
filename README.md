# SmartPark — Real-Time Parking & Reservation System

A full-stack web application designed for smart parking discovery, bay reservation, cashless payment, QR-based barrier gate check-in, and facility operator management.

---

## 🌟 Key Features

### For Drivers
- **Real-Time Lot Discovery & Interactive Map**: Explore nearby parking facilities on an interactive Leaflet map. Filter bays by type (Standard Car, EV Charging, Two-Wheeler, Accessible).
- **Advance Bay Reservation**: Select specific bays and vehicles with flexible booking durations.
- **15-Minute Arrival Window**: Automated grace period with automatic slot release to prevent held inventory.
- **Cashless Payments**: Server-calculated pricing (`hours × hourly_rate`) with idempotent payment verification.
- **Digital QR Parking Pass**: Instant digital pass for barrier gate entry and exit validation.

### For Parking Operators
- **Operator Command Center**: Real-time facility occupancy, today's verified revenue analytics, and live bay metrics.
- **Facility & Bay Management**: Register new parking facilities and manage bay statuses (`AVAILABLE`, `MAINTENANCE`, `OCCUPIED`).
- **Reservation Audit & Logs**: Dedicated reservation dashboard to monitor and search bookings across facilities.
- **Barrier Gate Scanner Terminal**: Live optical camera scanner with animated barrier gate simulation and audio validation feedback.

### Security & Architecture
- **Role-Based Access Control (RBAC)**: Strict role separation between `driver` and `operator`. Protected frontend routes and API endpoints returning `403 Forbidden` on unauthorized access.
- **Facility Isolation**: Operators only access and manage their own facilities, bookings, and revenue data.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic, Python-Jose (JWT), Uvicorn
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Leaflet, Lucide Icons, html5-qrcode
- **Testing**: Pytest, HTTPX

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Driver** | `sarthak@example.com` | `user123` | Map & Lots, Search, My Bookings, Vehicles |
| **Operator** | `operator@parking.com` | `operator123` | Dashboard, Lots, Bookings, Barrier Scanner |

*(Use the "Fill Demo Credentials" button on the sign-in screen for one-click login).*
