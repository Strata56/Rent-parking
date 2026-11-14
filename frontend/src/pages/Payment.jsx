import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import QRDisplay from '../components/QRDisplay';
import { paymentService } from '../services/paymentService';
import { ShieldCheck, Smartphone, ArrowLeft, CheckCircle2, Clock, Timer, Zap } from 'lucide-react';
import { parseUtcDate } from '../utils/helpers';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [upiId, setUpiId] = useState('commuter@okhdfcbank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedPass, setCompletedPass] = useState(null);

  // If page accessed directly without booking state
  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <p className="text-slate-600 text-sm">No active booking to checkout.</p>
          <Link to="/home" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
            Explore Parking Lots
          </Link>
        </div>
      </div>
    );
  }

  const {
    booking_id,
    slot_number,
    lot_name,
    total_amount,
    license_plate,
    hours,
    qr_code
  } = state;

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Create order & verify using UPI gateway
      await paymentService.createOrder(booking_id, total_amount || 100);
      await paymentService.verifyPayment({
        booking_id: booking_id,
        gateway: 'UPI',
        transaction_id: `upi_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
      });

      // Show confirmed pass
      const parsedDeadline = state.arrival_deadline ? parseUtcDate(state.arrival_deadline) : new Date(Date.now() + 15 * 60000);
      const arrivalDeadlineIso = parsedDeadline ? parsedDeadline.toISOString() : new Date(Date.now() + 15 * 60000).toISOString();
      setCompletedPass({
        booking_id,
        slot_number,
        lot_name,
        vehicle_plate: license_plate,
        qr_code: qr_code || 'SP-VERIFIED-PASS',
        status: 'CONFIRMED',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (hours || 2) * 3600000).toISOString(),
        arrival_deadline: arrivalDeadlineIso,
        extended_count: 0
      });
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking Setup
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
                ₹
              </div>
              <div>
                <h2 className="font-bold text-base">Cashless UPI Checkout</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant 256-bit Secure Verification
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
              UPI LIVE
            </span>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Invoice summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Facility:</span>
                <span className="font-semibold text-slate-800">{lot_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Assigned Slot:</span>
                <span className="font-bold text-blue-600">Bay {slot_number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vehicle Plate:</span>
                <span className="font-mono font-bold text-slate-800">{license_plate}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Duration:</span>
                <span className="font-semibold text-slate-800">{hours || 2} Hour(s)</span>
              </div>
              <div className="flex justify-between items-center text-blue-700 bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-100 text-xs">
                <span className="flex items-center gap-1 font-bold">
                  <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Arrival Window:
                </span>
                <span className="font-bold">15 Mins to park at bay</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-xl text-blue-600 font-extrabold">₹{Number(total_amount || 100).toFixed(2)}</span>
              </div>
            </div>

            {/* UPI Payment Mode Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Mode
                </label>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Instant Confirmation
                </span>
              </div>

              {/* UPI Active Tab */}
              <div className="p-3.5 rounded-2xl border-2 border-blue-600 bg-blue-50/60 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Unified Payments Interface (UPI)</span>
                    <span className="text-[11px] text-slate-500">Google Pay • PhonePe • Paytm • BHIM</span>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
              </div>

              {/* UPI ID input */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <label className="text-slate-700 font-semibold flex items-center justify-between">
                  <span>Enter UPI ID / VPA:</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. yourname@upi</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['@okhdfcbank', '@ybl', '@paytm', '@ibl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => {
                        const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                        setUpiId(`${prefix || 'commuter'}${handle}`);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 text-[10.5px] font-mono transition"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || !upiId.trim()}
              onClick={handleProcessPayment}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {loading ? 'Verifying with UPI...' : `Pay ₹${Number(total_amount || 100).toFixed(2)} via UPI`}
            </button>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Secured by NPCI UPI Gateway • No extra convenience fee
            </p>
          </div>
        </div>
      </main>

      {/* Show Pass on successful completion */}
      {completedPass && (
        <QRDisplay
          booking={completedPass}
          onClose={() => navigate('/history')}
        />
      )}
    </div>
  );
}
