# Smart Parking & Vehicle Management System

> A Digital Platform for Real-Time Parking Discovery, Reservation & Cashless Payment  
> **Author**: Sarthak Prabhakar Kambli (TYIT/438)

---

## 🌟 Key Features

1. **Real-Time Bay Discovery & Interactive Map**:
   - Leaflet / OpenStreetMap view showing parking lots across commercial, transit, and retail zones.
   - Filter by slot type: Standard Car, EV Fast Charging, Two-Wheelers/Bikes, and Accessible bays.
   - Dynamic 2D parking lot layout displaying real-time status: Available (Green), Occupied (Red), Reserved (Yellow), Maintenance (Gray).

2. **Advance Slot Reservation**:
   - Pick specific parking bays.
   - Select registered vehicles or add on the fly.
   - Flexible hourly duration with dynamic pricing calculation.

3. **Cashless Digital Payments**:
   - Mock Razorpay / Stripe / UPI checkout with instant transaction confirmation.
   - Automatic generation of unique digital parking passes with dynamic QR code tokens.

4. **Digital Parking Pass & QR Codes**:
   - Live countdown timer, assigned bay number, vehicle plate, and navigation link.
   - Print / Save as PDF ticket receipt.

5. **Hardware Integration Simulator (Barrier Gate & ANPR)**:
   - Automated barrier gate kiosk with OCR License Plate Recognition (ANPR) and optical QR pass scanner.
   - Graphical barrier arm opening/closing simulation with LED state indicators.
   - Automatic entry/exit detection and overstay surcharge calculations recorded in `entry_exit_logs`.

6. **Parking Operator Command Center**:
   - Facility analytics: total revenue, today's income, occupancy rate %, barrier vehicle movements.
   - Live slot bay override (toggle maintenance or available status with 1-click).
   - Real-time active parkers list and duration tracking.

---

## 🗄️ Database Architecture (ER Diagram Exact Match)

The system models all 9 entities from the official project ER diagram:

- `OPERATOR`: Lot operators and facility managers.
- `PARKING_LOT`: Registered facilities with GPS coordinates, total slots, and hourly rates.
- `PARKING_SLOT`: Individual bays (`slot_number`, `slot_type`, `status`).
- `USER`: Drivers and commuters.
- `VEHICLE`: Registered user vehicles with license plates and model types.
- `BOOKING`: Time-windowed reservations linked to slot, vehicle, user, and unique QR code.
- `PAYMENT`: Cashless transactions with transaction IDs, gateways, and amounts.
- `ENTRY_EXIT_LOG`: Barrier event log tracking entry/exit timestamps and verification method (`QR_CODE`, `ANPR`).
- `NOTIFICATION`: User notifications for booking confirmation, gate entry, and exit.

---

## 🚀 Quick Start (One-Click)

```
This will automatically:
1. Seed the database with realistic sample facilities and slots.
2. Launch the FastAPI backend on `http://127.0.0.1:8000`.
3. Launch the React frontend on `http://localhost:5173`.
4. Open the web application in your default browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Driver / Commuter** | `sarthak@example.com` | `user123` |
| **Lot Operator** | `operator@parking.com` | `operator123` |

*(You can also use the 1-click Demo Login buttons inside the app without typing credentials)*

---

## 🛠️ Manual Launch Commands

### Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Web App: [http://localhost:5173](http://localhost:5173)
