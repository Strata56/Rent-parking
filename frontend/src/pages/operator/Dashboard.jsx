import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../services/bookingService';
import { 
  ShieldCheck, RefreshCw, Layers, Plus, 
  BarChart3, CheckCircle2, AlertCircle, ArrowUpRight 
} from 'lucide-react';

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsData, bookingsData] = await Promise.all([
        bookingService.getParkingLots(),
        bookingService.getAllBookings().catch(() => [])
      ]);
      setLots(lotsData || []);
      setAllBookings(bookingsData || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live metrics
  const totalSlots = lots.reduce((acc, l) => acc + (l.total_slots || 0), 0);
  const availableSlots = lots.reduce((acc, l) => acc + (l.available_slots || 0), 0);
  const occupiedSlots = Math.max(0, totalSlots - availableSlots);
  const occupancyPercent = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  const estimatedRevenue = occupiedSlots * 60 * 3; // Estimated collection

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Operator Command Center
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live facility occupancy, revenue analytics, and barrier gate control</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/operator/scan"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" /> Open Barrier Scanner
            </Link>
            <Link
              to="/operator/manage-lots"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add / Manage Lots
            </Link>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Capacity</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalSlots}</div>
            <span className="text-xs text-slate-500 block">Across {lots.length} facilities</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Live Occupancy</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-600">{occupancyPercent}%</div>
            <span className="text-xs text-slate-500 block">{occupiedSlots} bays occupied / held</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Available Spots</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{availableSlots}</div>
            <span className="text-xs text-emerald-600 font-medium block">Ready for reservations</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Est. Daily Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-600">₹{estimatedRevenue.toLocaleString()}</div>
            <span className="text-xs text-slate-500 block">Digital & UPI receipts</span>
          </div>
        </div>

        {/* Managed Parking Lots List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Managed Facilities</h2>
            <Link to="/operator/manage-lots" className="text-xs font-semibold text-blue-600 hover:underline">
              Add New Parking Lot →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lots.map((lot) => (
              <div key={lot.lot_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-sm text-slate-900 truncate">{lot.name}</h4>
                <p className="text-xs text-slate-500 truncate">{lot.address}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-semibold">{lot.available_slots} / {lot.total_slots} open</span>
                  <span className="font-bold text-blue-600">₹{lot.price_per_hour}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active & Recent Parkers</h2>
              <p className="text-xs text-slate-500">Live reservation logs with slot and vehicle validation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Facility</th>
                  <th className="p-4">Assigned Bay</th>
                  <th className="p-4">Vehicle Plate</th>
                  <th className="p-4">QR Code Token</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No active bookings recorded in the system.
                    </td>
                  </tr>
                ) : (
                  allBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800">{b.user_name || 'Driver'}</td>
                      <td className="p-4 text-slate-600">{b.lot_name}</td>
                      <td className="p-4 font-bold text-blue-600">Bay {b.slot_number}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">{b.license_plate}</td>
                      <td className="p-4 font-mono text-slate-500">{b.qr_code}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
