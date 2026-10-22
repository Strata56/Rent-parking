import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { authService } from '../services/authService';
import { bookingService } from '../services/bookingService';
import { User, Car, Plus, Shield, Phone, Mail, Trash2, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const user = authService.getCurrentUser() || {
    name: 'Sarthak Kambli',
    email: 'sarthak@example.com',
    role: 'driver',
    phone: '+91 9820011223'
  };

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Car');
  const [newModel, setNewModel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch registered vehicles from backend database
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getVehicles();
      setVehicles(data || []);
    } catch (err) {
      console.error('Failed to load vehicles from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Save new vehicle directly to database
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      setError('Please provide a license plate number');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      await bookingService.addVehicle({
        license_plate: newPlate.toUpperCase().trim(),
        vehicle_type: newType,
        make_model: newModel.trim() || `${newType} Vehicle`
      });

      setMessage('Vehicle added to database successfully!');
      setNewPlate('');
      setNewModel('');
      setShowAdd(false);
      await loadVehicles();
    } catch (err) {
      setError(err.message || 'Failed to add vehicle to database');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove vehicle from database
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your account?')) return;
    try {
      setError('');
      setMessage('');
      await bookingService.deleteVehicle(vehicleId);
      setMessage('Vehicle removed successfully.');
      await loadVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to remove vehicle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Account & Vehicle Management</h1>

        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize border border-blue-200">
                {user.role === 'commuter' ? 'Driver' : (user.role || 'Driver')}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user.phone || '+91 9820011223'}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Verified Driver Profile
              </span>
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Registered Vehicles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved vehicles for automated number plate recognition (ANPR) and bay reservation
              </p>
            </div>

            <button
              onClick={() => {
                setShowAdd(!showAdd);
                setError('');
                setMessage('');
              }}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          {showAdd && (
            <form onSubmit={handleAddVehicle} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-xs">Register New Vehicle to Database</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="Car">Car</option>
                    <option value="EV">EV (Electric)</option>
                    <option value="Bike">Bike / Two-Wheeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Make / Model</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving to Database...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading vehicles from database...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
              <p>No vehicles registered in your account yet.</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                + Add your first vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {vehicles.map((v) => (
                <div
                  key={v.vehicle_id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 block">{v.license_plate}</span>
                    <span className="text-xs text-slate-500">{v.make_model || 'Vehicle'} • {v.vehicle_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                      {v.vehicle_type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v.vehicle_id)}
                      title="Remove vehicle"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
