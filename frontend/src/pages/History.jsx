import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingCard from '../components/BookingCard';
import QRDisplay from '../components/QRDisplay';
import { bookingService } from '../services/bookingService';
import { Clock, PlusCircle } from 'lucide-react';

export default function History() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this parking reservation?')) return;
    try {
      setCancelError('');
      await bookingService.cancelBooking(bookingId);
      loadBookings();
    } catch (err) {
      setCancelError(err.response?.data?.detail || err.message || 'Failed to cancel reservation');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {cancelError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center justify-between">
            <span>{cancelError}</span>
            <button onClick={() => setCancelError('')} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Dismiss</button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              My Booking History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your parking slots, view digital QR passes, and access logs</p>
          </div>

          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Book New Bay
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <p className="text-slate-500 text-sm">You do not have any past or active reservations yet.</p>
            <Link
              to="/home"
              className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
            >
              Explore Parking Facilities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <BookingCard
                key={b.booking_id}
                booking={b}
                onShowPass={(booking) => setSelectedPass(booking)}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}
      </main>

      {/* QR pass modal */}
      {selectedPass && (
        <QRDisplay
          booking={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
}
