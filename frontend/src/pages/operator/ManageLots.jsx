import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../services/bookingService';
import { Building2, Plus, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManageLots() {
  const [lots, setLots] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState(50);
  const [totalSlots, setTotalSlots] = useState(24);
  const [latitude, setLatitude] = useState(19.076);
  const [longitude, setLongitude] = useState(72.877);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadLots = async () => {
    try {
      const data = await bookingService.getParkingLots();
      setLots(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLots();
  }, []);

  const handleCreateLot = async (e) => {
    e.preventDefault();
    if (!name || !address) return;

    try {
      setLoading(true);
      setMessage('');
      await bookingService.createLot({
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        total_slots: parseInt(totalSlots),
        price_per_hour: parseFloat(pricePerHour)
      });
      setMessage('Parking facility added successfully!');
      setName('');
      setAddress('');
      loadLots();
    } catch (err) {
      alert(err.message || 'Failed to create facility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link
            to="/operator/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Parking Facilities</h1>
            <p className="text-xs text-slate-500">Add new lots and configure slot pricing</p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Add Lot Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Add New Parking Facility
          </h2>

          <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bandra Kurla Complex Parking Tower"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. BKC G-Block, Bandra East, Mumbai"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total Capacity (Bays)</label>
                <input
                  type="number"
                  min="4"
                  max="100"
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition"
            >
              {loading ? 'Creating...' : 'Register Facility & Auto-Generate Slots'}
            </button>
          </form>
        </div>

        {/* Existing Lots Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Configured Facilities ({lots.length})</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {lots.map((lot) => (
              <div key={lot.lot_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{lot.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{lot.address}</p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block">Slots</span>
                    <span className="font-semibold text-slate-800">{lot.available_slots} / {lot.total_slots} Open</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Rate</span>
                    <span className="font-bold text-blue-600">₹{lot.price_per_hour}/hr</span>
                  </div>
                  <Link
                    to={`/booking?lot_id=${lot.lot_id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    View Layout
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
