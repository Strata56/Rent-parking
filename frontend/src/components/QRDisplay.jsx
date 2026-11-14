import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle2, MapPin, X, Timer, AlertTriangle, Clock, PlusCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { parseUtcDate } from '../utils/helpers';

export default function QRDisplay({ booking, onClose = null, onBookingUpdated = null }) {
  if (!booking) return null;

  const slotNum = booking.slot_number || 'A-01';
  const plate = booking.vehicle_plate || booking.license_plate || 'MH-VEHICLE';

  // Calculate default arrival deadline (15 minutes from start_time/created_at if not explicitly set)
  const computeInitialDeadline = () => {
    if (booking.arrival_deadline) {
      const parsed = parseUtcDate(booking.arrival_deadline);
      return parsed ? parsed.getTime() : Date.now() + 15 * 60 * 1000;
    }
    const baseDate = parseUtcDate(booking.created_at || booking.start_time);
    const base = baseDate ? baseDate.getTime() : Date.now();
    return base + 15 * 60 * 1000;
  };

  const [deadlineMs, setDeadlineMs] = useState(computeInitialDeadline);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.floor((computeInitialDeadline() - Date.now()) / 1000)));
  const [extendedCount, setExtendedCount] = useState(booking.extended_count || 0);
  const [extending, setExtending] = useState(false);
  const [extendNotice, setExtendNotice] = useState('');
  const [extendError, setExtendError] = useState('');

  // Synchronize if booking prop changes
  useEffect(() => {
    const d = computeInitialDeadline();
    setDeadlineMs(d);
    setSecondsLeft(Math.max(0, Math.floor((d - Date.now()) / 1000)));
    setExtendedCount(booking.extended_count || 0);
  }, [booking.arrival_deadline, booking.extended_count, booking.created_at, booking.start_time]);

  // Real-time ticking countdown
  useEffect(() => {
    if (booking.status !== 'CONFIRMED') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineMs, booking.status]);

  const handleExtend = async () => {
    try {
      setExtending(true);
      setExtendError('');
      setExtendNotice('');
      const res = await bookingService.extendArrival(booking.booking_id);
      if (res.arrival_deadline) {
        const parsed = parseUtcDate(res.arrival_deadline);
        const newDeadline = parsed ? parsed.getTime() : Date.now() + 10 * 60 * 1000;
        setDeadlineMs(newDeadline);
        setSecondsLeft(Math.max(0, Math.floor((newDeadline - Date.now()) / 1000)));
      } else {
        setDeadlineMs(prev => prev + 10 * 60 * 1000);
      }
      setExtendedCount(res.extended_count || 1);
      setExtendNotice('Extra +10 mins granted! Drive safely.');
      if (onBookingUpdated) onBookingUpdated();
    } catch (err) {
      setExtendError(err.response?.data?.detail || err.message || 'Could not extend arrival time');
    } finally {
      setExtending(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = parseUtcDate(isoString);
      return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : isoString;
    } catch {
      return isoString;
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isConfirmed = booking.status === 'CONFIRMED';
  const isExpired = booking.status === 'EXPIRED' || (isConfirmed && secondsLeft <= 0);
  const isActive = booking.status === 'ACTIVE';

  // Determine timer color theme
  let timerTheme = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let barColor = 'bg-emerald-500';
  if (minutes < 5) {
    timerTheme = 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse';
    barColor = 'bg-rose-500';
  } else if (minutes < 10) {
    timerTheme = 'bg-amber-50 border-amber-200 text-amber-800';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-sm w-full relative max-h-[92vh] overflow-y-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-slate-200 z-10 p-1 rounded-full bg-black/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Pass Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 inline-block mb-1">
            Smart Entry Pass
          </span>
          <h3 className="text-xl font-bold leading-tight">{booking.lot_name || "SmartPark"}</h3>
          <p className="text-xs text-blue-100 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{booking.lot_address || "Mumbai Facility"}</span>
          </p>
        </div>

        {/* Ticket Divider */}
        <div className="relative flex items-center justify-between bg-white px-2 py-1">
          <div className="w-4 h-6 bg-slate-900/60 rounded-r-full -ml-4"></div>
          <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2"></div>
          <div className="w-4 h-6 bg-slate-900/60 rounded-l-full -mr-4"></div>
        </div>

        {/* Content */}
        <div className="p-5 pt-2 space-y-3.5 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5 px-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Bay Number</span>
              <span className="text-2xl font-black text-blue-700">{slotNum}</span>
            </div>
            <div className={`border rounded-2xl p-2.5 px-4 ${
              isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : isActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
              <span className="text-sm font-bold flex items-center gap-1 mt-1">
                {isExpired ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    EXPIRED
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {isActive ? 'PARKED' : 'RESERVED'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Real-Time Arrival Window Banner */}
          {isConfirmed && !isExpired && (
            <div className={`rounded-2xl p-3 border text-left space-y-2 transition-all ${timerTheme}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-4 h-4" />
                  Time Left to Park:
                </span>
                <span className="font-mono text-base font-black tracking-wider">
                  {timeFormatted}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(5, (secondsLeft / (15 * 60)) * 100))}%` }}
                ></div>
              </div>

              <p className="text-[10px] leading-tight opacity-90">
                ⚡ Scan this pass at the gate barrier before timer hits 00:00 to claim your bay, or the slot is auto-released.
              </p>

              {/* Running late extension trigger */}
              {extendedCount === 0 && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={extending}
                    onClick={handleExtend}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[10.5px] font-bold shadow-xs border border-black/10 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    {extending ? 'Extending...' : 'Running Late? +10 Mins'}
                  </button>
                  <span className="text-[9.5px] opacity-75 font-medium">1 extension allowed</span>
                </div>
              )}
            </div>
          )}

          {extendNotice && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
              {extendNotice}
            </div>
          )}

          {extendError && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
              {extendError}
            </div>
          )}

          {isExpired && (
            <div className="rounded-2xl p-3 bg-rose-50 border border-rose-200 text-rose-800 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Arrival Window Elapsed (Slot Released)
              </div>
              <p className="text-[10.5px] text-rose-700 leading-tight">
                You did not check in at the barrier gate within the allocated time. This bay has been made available to other drivers.
              </p>
            </div>
          )}

          {isActive && (
            <div className="rounded-2xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-left flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <strong className="block text-emerald-900 font-bold">Vehicle Verified in Bay {slotNum}</strong>
                Entry confirmed. Scan this same pass on departure.
              </div>
            </div>
          )}

          {/* QR Code Container */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 inline-block">
            <QRCodeSVG value={booking.qr_code || "SP-MOCK-PASS"} size={150} level="H" />
            <span className="font-mono font-bold text-xs text-slate-700 tracking-wider mt-1.5 block">
              {booking.qr_code}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-mono font-bold text-slate-800">{plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Booked From:</span>
              <span className="font-medium text-slate-800">{formatTime(booking.start_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reserved Until:</span>
              <span className="font-medium text-slate-800">{formatTime(booking.end_time)}</span>
            </div>
            {booking.arrival_deadline && (
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Arrival Cutoff:
                </span>
                <span className="text-blue-700 font-bold">{formatTime(booking.arrival_deadline)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" /> Print / Save Pass
          </button>
        </div>
      </div>
    </div>
  );
}
