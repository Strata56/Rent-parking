import React from 'react';
import { QrCode, MapPin, XCircle, CheckCircle2, Timer, AlertTriangle } from 'lucide-react';
import { parseUtcDate } from '../utils/helpers';

export default function BookingCard({ booking, onShowPass, onCancel }) {
  // Format date helper
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = parseUtcDate(isoString);
      return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : isoString;
    } catch {
      return isoString;
    }
  };

  const isConfirmed = booking.status === 'CONFIRMED';
  const isActive = booking.status === 'ACTIVE';
  const isCancelled = booking.status === 'CANCELLED';
  
  // Calculate remaining arrival minutes
  let minutesLeft = null;
  let isExpired = booking.status === 'EXPIRED';
  if (isConfirmed && booking.arrival_deadline) {
    const deadline = parseUtcDate(booking.arrival_deadline);
    const diffMs = deadline ? deadline.getTime() - Date.now() : 0;
    minutesLeft = Math.ceil(diffMs / 60000);
    if (minutesLeft <= 0) {
      isExpired = true;
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="space-y-3">
        {/* Status badge and bay */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            isExpired
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isConfirmed
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : isCancelled
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {isExpired ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                EXPIRED
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isActive ? 'PARKED' : booking.status}
              </>
            )}
          </span>

          <div className="bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
            Bay {booking.slot_number || 'A-01'}
          </div>
        </div>

        {/* Real-time Arrival Countdown Pill for Confirmed Reservations */}
        {isConfirmed && !isExpired && minutesLeft !== null && (
          <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-[11px] font-bold ${
            minutesLeft <= 5
              ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
              : minutesLeft <= 10
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              Arrival Window:
            </span>
            <span className="font-mono">{minutesLeft}m left to park</span>
          </div>
        )}

        {/* Facility Info */}
        <div>
          <h3 className="font-bold text-base text-slate-900">{booking.lot_name || 'Parking Facility'}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{booking.lot_address || 'Facility Address'}</span>
          </p>
        </div>

        {/* Schedule */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Vehicle:</span>
            <span className="font-mono font-bold text-slate-800">{booking.vehicle_plate || 'MH-CAR'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Booked From:</span>
            <span className="font-medium text-slate-800">{formatTime(booking.start_time)}</span>
          </div>
          {booking.arrival_deadline && isConfirmed && (
            <div className="flex justify-between text-blue-700 font-semibold">
              <span className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" /> Park Before:
              </span>
              <span className="font-bold">{formatTime(booking.arrival_deadline)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Valid Until:</span>
            <span className="font-medium text-slate-800">{formatTime(booking.end_time)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onShowPass(booking)}
          className={`flex-1 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition ${
            isExpired
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          {isExpired ? 'Inspect Pass' : 'View QR Pass'}
        </button>

        {(isConfirmed || isActive) && !isExpired && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(booking.booking_id)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 text-xs font-semibold transition"
            title="Cancel Reservation"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
