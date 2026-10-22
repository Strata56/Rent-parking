import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle2, MapPin, X } from 'lucide-react';

export default function QRDisplay({ booking, onClose = null }) {
  if (!booking) return null;

  const slotNum = booking.slot_number || 'A-01';
  const plate = booking.vehicle_plate || booking.license_plate || 'MH-VEHICLE';

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-sm w-full relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-slate-200 z-10 p-1 rounded-full bg-black/20"
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
        <div className="p-6 pt-2 space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5 px-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Bay Number</span>
              <span className="text-2xl font-black text-blue-700">{slotNum}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 px-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Pass Status</span>
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                {booking.status || "CONFIRMED"}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
            <QRCodeSVG value={booking.qr_code || "SP-MOCK-PASS"} size={160} level="H" />
            <span className="font-mono font-bold text-xs text-slate-700 tracking-wider mt-2 block">
              {booking.qr_code}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-mono font-bold text-slate-800">{plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valid From:</span>
              <span className="font-medium text-slate-800">{formatTime(booking.start_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valid Until:</span>
              <span className="font-medium text-slate-800">{formatTime(booking.end_time)}</span>
            </div>
          </div>

          <button
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
