import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../services/bookingService';
import { 
  ArrowLeft, RefreshCw, Search, ShieldCheck, 
  Calendar, CheckCircle2, Clock, Car, AlertTriangle, XCircle 
} from 'lucide-react';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getOperatorBookings();
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load operator bookings:', err);
      // Fallback to getAllBookings
      try {
        const fallback = await bookingService.getAllBookings();
        setBookings(fallback || []);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = 
      (b.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.lot_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.license_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.slot_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.qr_code || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/operator/dashboard"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Facility Bookings & Reservations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and audit all reservations across your assigned parking facilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/operator/scan"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" /> Barrier Scanner
            </Link>
            <button
              onClick={loadBookings}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, facility, plate, or bay..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">
              Showing {filteredBookings.length} of {bookings.length} reservations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Facility</th>
                  <th className="p-4">Bay</th>
                  <th className="p-4">Vehicle Plate</th>
                  <th className="p-4">QR Token</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Arrival Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading facility reservations...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No matching reservations found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-900">{b.user_name || 'Driver'}</td>
                      <td className="p-4 text-slate-600">{b.lot_name}</td>
                      <td className="p-4 font-black text-blue-600">Bay {b.slot_number}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">{b.license_plate}</td>
                      <td className="p-4 font-mono text-slate-500">{b.qr_code}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {b.arrival_deadline ? (
                          new Date(b.arrival_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          'N/A'
                        )}
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
