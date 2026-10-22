import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SlotGrid, { isVehicleSlotCompatible } from '../components/SlotGrid';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { 
  ArrowLeft, Car, Clock, ShieldCheck, MapPin, 
  CheckCircle2, Plus, Zap, Bike, AlertCircle, Info
} from 'lucide-react';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlLotId = searchParams.get('lot_id') || '';

  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(urlLotId);
  const [lotDetails, setLotDetails] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hours, setHours] = useState(2);
  
  // Vehicles from database
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Car');
  const [newModel, setNewModel] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = authService.getCurrentUser();

  // Load facilities list
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const data = await bookingService.getParkingLots();
        setLots(data || []);
        if (!selectedLotId && data && data.length > 0) {
          setSelectedLotId(data[0].lot_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLots();
  }, []);

  // Load registered vehicles from database
  const fetchVehicles = async () => {
    try {
      const data = await bookingService.getVehicles();
      setVehicles(data || []);
      if (data && data.length > 0) {
        setSelectedVehicle(data[0]);
        setLicensePlate(data[0].license_plate);
      }
    } catch (err) {
      console.error('Failed to load user vehicles:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchVehicles();
    }
  }, []);

  // Load selected lot details and slots
  useEffect(() => {
    if (!selectedLotId) return;
    const fetchLotDetails = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getLotById(selectedLotId);
        setLotDetails(data);
        setSelectedSlot(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLotDetails();
  }, [selectedLotId]);

  // Slot selection with vehicle type restriction check
  const handleSelectSlot = (slot) => {
    const vType = selectedVehicle?.vehicle_type || 'Car';
    if (!isVehicleSlotCompatible(vType, slot.slot_type)) {
      setError(`Cannot select slot ${slot.slot_number}: This is a ${slot.slot_type} bay, but your selected vehicle is a ${vType}. Please choose a matching bay.`);
      return;
    }
    setSelectedSlot(slot);
    setError('');
  };

  // Add a new vehicle to database and select it
  const handleSaveAndSelectVehicle = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      setError('Please provide a license plate');
      return;
    }

    try {
      setSavingVehicle(true);
      setError('');
      const res = await bookingService.addVehicle({
        license_plate: newPlate.toUpperCase().trim(),
        vehicle_type: newType,
        make_model: newModel.trim() || `${newType} Vehicle`
      });

      // Reload vehicles from database
      const updatedList = await bookingService.getVehicles();
      setVehicles(updatedList || []);
      
      const newChosen = (updatedList || []).find(v => v.license_plate === newPlate.toUpperCase().trim()) || res;
      setSelectedVehicle(newChosen);
      setLicensePlate(newChosen.license_plate);

      // Re-validate previously selected slot against new vehicle
      if (selectedSlot && !isVehicleSlotCompatible(newChosen.vehicle_type, selectedSlot.slot_type)) {
        setSelectedSlot(null);
        setError(`Notice: Selected bay was cleared because it does not match your new ${newChosen.vehicle_type}. Please select a compatible bay below.`);
      }

      setShowAddVehicle(false);
      setNewPlate('');
      setNewModel('');
    } catch (err) {
      setError(err.message || 'Failed to register vehicle to database');
    } finally {
      setSavingVehicle(false);
    }
  };

  // Choose from existing vehicles
  const handlePickVehicle = (v) => {
    setSelectedVehicle(v);
    setLicensePlate(v.license_plate);

    // If a slot was already selected, check if it's compatible with the new vehicle
    if (selectedSlot && !isVehicleSlotCompatible(v.vehicle_type, selectedSlot.slot_type)) {
      setSelectedSlot(null);
      setError(`Notice: Selected bay was cleared because it does not match your ${v.vehicle_type}. Please choose a compatible bay below.`);
    } else {
      setError('');
    }
  };

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (!selectedVehicle && !licensePlate) {
      setError('Please select or add a vehicle before booking.');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available parking bay matching your vehicle type from the layout.');
      return;
    }

    const vType = selectedVehicle?.vehicle_type || 'Car';
    if (!isVehicleSlotCompatible(vType, selectedSlot.slot_type)) {
      setError(`Vehicle mismatch: Cannot reserve a ${selectedSlot.slot_type} bay for your ${vType}. Please choose a matching ${vType} slot.`);
      return;
    }

    const plateToUse = (selectedVehicle?.license_plate || licensePlate).trim().toUpperCase();

    try {
      setBookingLoading(true);
      setError('');
      const res = await bookingService.createBooking({
        slot_id: selectedSlot.slot_id,
        vehicle_id: selectedVehicle?.vehicle_id,
        license_plate: plateToUse,
        vehicle_type: vType,
        duration_hours: hours
      });

      // Navigate to Payment page with booking response details
      navigate('/payment', {
        state: {
          booking_id: res.booking_id,
          slot_number: res.slot_number,
          lot_name: res.lot_name,
          total_amount: res.total_amount,
          license_plate: plateToUse,
          hours: hours,
          qr_code: res.qr_code
        }
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const totalPayable = (lotDetails?.price_per_hour || 50) * hours;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reserve a Parking Bay</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your vehicle and choose a matching bay (Bikes to Bike slots, EVs to EV charging, Cars to Car slots)
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Facility Selector Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Parking Facility
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none"
            >
              {lots.map((lot) => (
                <option key={lot.lot_id} value={lot.lot_id}>
                  {lot.name} (₹{lot.price_per_hour}/hr — {lot.available_slots} slots open)
                </option>
              ))}
            </select>
          </div>

          {lotDetails && (
            <div className="text-right sm:pl-4 sm:border-l border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 block">Rate / Hour</span>
              <span className="text-xl font-bold text-blue-600">₹{lotDetails.price_per_hour}</span>
            </div>
          )}
        </div>

        {/* 2. Vehicle Selector Section (Placed first so the layout adapts immediately) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Step 1: Choose Your Vehicle
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bays in the layout below will automatically filter and restrict to match this vehicle type
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-blue-600 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddVehicle ? 'Cancel' : 'Add New Vehicle'}
            </button>
          </div>

          {/* Form to add new vehicle into database right from booking page */}
          {showAddVehicle && (
            <form onSubmit={handleSaveAndSelectVehicle} className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3 text-xs">
              <h3 className="font-bold text-blue-900">Add Vehicle & Match Bays</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-02-AB-1234"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Car">Car</option>
                    <option value="EV">EV (Electric)</option>
                    <option value="Bike">Bike / Two-Wheeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Make / Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda City / Ather 450X"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {savingVehicle ? 'Saving...' : 'Save & Select Vehicle'}
                </button>
              </div>
            </form>
          )}

          {/* Vehicle Selection Grid */}
          {vehicles.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <p className="text-xs text-slate-500">No vehicles saved yet. Add your vehicle to continue.</p>
              <button
                type="button"
                onClick={() => setShowAddVehicle(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                + Register Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.vehicle_id === v.vehicle_id || licensePlate === v.license_plate;
                return (
                  <div
                    key={v.vehicle_id}
                    onClick={() => handlePickVehicle(v)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-slate-900">{v.license_plate}</span>
                        {v.vehicle_type === 'EV' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <Zap className="w-3 h-3" /> EV
                          </span>
                        )}
                        {v.vehicle_type === 'Bike' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 flex items-center gap-0.5">
                            <Bike className="w-3 h-3" /> Bike
                          </span>
                        )}
                        {v.vehicle_type === 'Car' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 flex items-center gap-0.5">
                            <Car className="w-3 h-3" /> Car
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{v.make_model || 'Vehicle'} • {v.vehicle_type}</p>
                    </div>

                    <div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Interactive Slot Grid (Step 2) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-800">
              Step 2: Pick a Matching Parking Bay
            </h2>
            {selectedVehicle && (
              <span className="text-xs font-semibold text-slate-500">
                Only <strong className="text-blue-700">{selectedVehicle.vehicle_type}</strong> bays are eligible
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
              Loading parking slots...
            </div>
          ) : lotDetails ? (
            <SlotGrid
              slots={lotDetails.slots || []}
              selectedSlotId={selectedSlot?.slot_id}
              onSelectSlot={handleSelectSlot}
              selectedVehicleType={selectedVehicle?.vehicle_type || 'Car'}
              onIncompatibleClick={(slot, vType) => {
                setError(`Slot ${slot.slot_number} is restricted to ${slot.slot_type}s only. Your selected vehicle is a ${vType}.`);
              }}
            />
          ) : null}
        </div>

        {/* 4. Booking Summary & Confirmation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Step 3: Reservation Summary & Duration</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicle Chosen */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Selected Vehicle:</span>
              <span className="text-base font-mono font-bold text-blue-700">
                {selectedVehicle ? `${selectedVehicle.license_plate} (${selectedVehicle.vehicle_type})` : 'No vehicle selected'}
              </span>
            </div>

            {/* Slot Selected */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Selected Bay:</span>
              <span className="text-base font-bold text-slate-800">
                {selectedSlot ? `Bay ${selectedSlot.slot_number} (${selectedSlot.slot_type})` : 'None selected (Click a green slot)'}
              </span>
            </div>

            {/* Duration */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 block">Duration:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition ${
                      hours === h
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Total Amount Due</span>
              <span className="text-2xl font-black text-slate-900">₹{totalPayable.toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={!selectedSlot || !selectedVehicle || bookingLoading}
              onClick={handleConfirmBooking}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {bookingLoading ? 'Reserving...' : `Proceed to Payment (₹${totalPayable.toFixed(2)})`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
