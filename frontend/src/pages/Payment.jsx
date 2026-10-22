import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import QRDisplay from '../components/QRDisplay';
import { paymentService } from '../services/paymentService';
import { ShieldCheck, Smartphone, CreditCard, Building, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [method, setMethod] = useState('UPI');
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

      // Create order & verify
      await paymentService.createOrder(booking_id, total_amount || 100);
      await paymentService.verifyPayment({
        booking_id: booking_id,
        gateway: method
      });

      // Show confirmed pass
      setCompletedPass({
        booking_id,
        slot_number,
        lot_name,
        vehicle_plate: license_plate,
        qr_code: qr_code || 'SP-VERIFIED-PASS',
        status: 'CONFIRMED',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (hours || 2) * 3600000).toISOString()
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
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
                ₹
              </div>
              <div>
                <h2 className="font-bold text-base">Cashless Payment Gateway</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Razorpay 256-bit Secure
                </p>
              </div>
            </div>
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
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span>Total Amount:</span>
                <span className="text-xl text-blue-600 font-extrabold">₹{Number(total_amount || 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                    method === 'UPI'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                    method === 'CARD'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('NETBANKING')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                    method === 'NETBANKING'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {/* Interactive mode inputs */}
            {method === 'UPI' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <label className="text-slate-600 font-medium">Virtual Payment Address (VPA):</label>
                <input
                  type="text"
                  defaultValue="commuter@upi"
                  className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
            )}

            {method === 'CARD' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                <input
                  type="text"
                  defaultValue="4242 •••• •••• 4242"
                  className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" defaultValue="12/28" className="bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs" />
                  <input type="password" defaultValue="•••" className="bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs" />
                </div>
              </div>
            )}

            {method === 'NETBANKING' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <select className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-xs">
                  <option>HDFC Bank Retail</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleProcessPayment}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {loading ? 'Authorizing Payment...' : `Confirm & Pay ₹${Number(total_amount || 100).toFixed(2)}`}
            </button>
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
