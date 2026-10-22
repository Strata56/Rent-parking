import React from 'react';
import { Car, Zap, Bike, Accessibility, CheckCircle2, Wrench, Ban } from 'lucide-react';

export const isVehicleSlotCompatible = (vehicleType, slotType) => {
  if (!vehicleType || !slotType) return true;
  const v = vehicleType.trim().toUpperCase();
  const s = slotType.trim().toUpperCase();

  // Bike can only park in BIKE slot
  if (v.includes('BIKE') || v.includes('TWO-WHEELER') || v.includes('SCOOTER') || v.includes('MOTORCYCLE')) {
    return s === 'BIKE';
  }
  // EV requires EV charging slot
  if (v === 'EV' || v.includes('ELECTRIC')) {
    return s === 'EV';
  }
  // Car / SUV can park in CAR or ACCESSIBLE slot
  if (v === 'CAR' || v === 'SUV' || v === 'SEDAN' || v === 'HATCHBACK') {
    return s === 'CAR' || s === 'ACCESSIBLE';
  }
  return v === s;
};

export default function SlotGrid({ 
  slots = [], 
  selectedSlotId = null, 
  onSelectSlot = () => {}, 
  isOperator = false, 
  onToggleStatus = null,
  selectedVehicleType = 'Car',
  onIncompatibleClick = null
}) {
  const getSlotTypeIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('EV')) {
      return <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />;
    }
    if (t.includes('BIKE')) {
      return <Bike className="w-4 h-4 text-sky-400" />;
    }
    if (t.includes('ACCESSIBLE')) {
      return <Accessibility className="w-4 h-4 text-blue-400" />;
    }
    return <Car className="w-4 h-4 text-slate-300" />;
  };

  const getStatusStyle = (status, isSelected, isCompatible) => {
    if (isSelected) {
      return 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 shadow-lg scale-105 z-10';
    }

    if (!isOperator && !isCompatible) {
      return 'bg-slate-900/40 text-slate-500 border-slate-800/80 opacity-40 cursor-not-allowed hover:border-rose-900/50';
    }

    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400 hover:shadow cursor-pointer';
      case 'OCCUPIED':
        return 'bg-rose-50 text-rose-700 border-rose-300 cursor-not-allowed opacity-90';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-800 border-amber-300 cursor-not-allowed opacity-95';
      case 'MAINTENANCE':
        return 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Group slots by row letter (e.g. A-01, B-02)
  const rows = {};
  slots.forEach((s) => {
    const rowKey = s.slot_number.split('-')[0] || 'A';
    if (!rows[rowKey]) rows[rowKey] = [];
    rows[rowKey].push(s);
  });

  return (
    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800">
      {/* Header and status indicators */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Parking Bay Layout
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {slots.length} Bays Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isOperator 
              ? 'Click any slot to toggle maintenance or availability status.' 
              : `Select a matching green bay for your ${selectedVehicleType || 'selected'} vehicle.`}
          </p>
        </div>

        {/* Selected vehicle filter pill */}
        {!isOperator && selectedVehicleType && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400">Filtering for:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              {getSlotTypeIcon(selectedVehicleType)}
              {selectedVehicleType} Only
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500"></span>
            <span className="text-slate-300">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500"></span>
            <span className="text-slate-300">Reserved</span>
          </div>
          {!isOperator && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-700 border border-slate-600 opacity-60"></span>
              <span className="text-slate-400">Mismatch (Disabled)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">EV Bay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-300">Bike Bay</span>
          </div>
        </div>
      </div>

      {/* Central Driveway */}
      <div className="py-4">
        <div className="w-full py-1.5 rounded-xl border border-dashed border-slate-700 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
          Central Driveway / Entry Lane
        </div>
      </div>

      {/* Bays by Row */}
      <div className="space-y-6">
        {Object.entries(rows).map(([rowLabel, rowSlots]) => (
          <div key={rowLabel} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Zone {rowLabel}
              </span>
              <span>
                {rowSlots.filter(s => s.status === 'AVAILABLE' && (isOperator || isVehicleSlotCompatible(selectedVehicleType, s.slot_type))).length} matching available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {rowSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.slot_id;
                const isAvailable = slot.status === 'AVAILABLE';
                const isCompatible = isOperator ? true : isVehicleSlotCompatible(selectedVehicleType, slot.slot_type);

                return (
                  <button
                    key={slot.slot_id}
                    type="button"
                    disabled={!isOperator && (!isAvailable && !isSelected)}
                    onClick={() => {
                      if (isOperator && onToggleStatus) {
                        onToggleStatus(slot);
                      } else if (!isCompatible) {
                        if (onIncompatibleClick) {
                          onIncompatibleClick(slot, selectedVehicleType);
                        }
                      } else if (isAvailable) {
                        onSelectSlot(slot);
                      }
                    }}
                    title={!isCompatible ? `Slot ${slot.slot_number} is reserved for ${slot.slot_type}s only (Selected vehicle is a ${selectedVehicleType})` : ''}
                    className={`relative rounded-xl p-3 border-2 transition-all flex flex-col items-center justify-between min-h-[95px] ${getStatusStyle(
                      slot.status,
                      isSelected,
                      isCompatible
                    )}`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : ''}`}>
                        {slot.slot_number}
                      </span>
                      <div className={isSelected ? 'text-white' : ''}>
                        {getSlotTypeIcon(slot.slot_type)}
                      </div>
                    </div>

                    <div className="my-1 flex items-center justify-center">
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : !isCompatible && !isOperator ? (
                        <Ban className="w-5 h-5 text-slate-600" />
                      ) : slot.status === 'OCCUPIED' ? (
                        <Car className="w-5 h-5 text-rose-600" />
                      ) : slot.status === 'RESERVED' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-amber-200 text-amber-900">
                          Hold
                        </span>
                      ) : slot.status === 'MAINTENANCE' ? (
                        <Wrench className="w-5 h-5 text-slate-400" />
                      ) : (
                        <div className="w-6 h-1 rounded-full bg-emerald-400/60"></div>
                      )}
                    </div>

                    <div className="w-full text-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider block truncate ${
                        isSelected 
                          ? 'text-blue-100' 
                          : !isCompatible && !isOperator 
                          ? 'text-slate-500' 
                          : ''
                      }`}>
                        {isSelected 
                          ? 'SELECTED' 
                          : !isCompatible && !isOperator 
                          ? `${slot.slot_type} ONLY` 
                          : slot.status}
                      </span>
                    </div>

                    {slot.slot_type === 'EV' && !isSelected && isCompatible && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                        ⚡
                      </span>
                    )}

                    {slot.slot_type === 'BIKE' && !isSelected && isCompatible && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px]">
                        🏍️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
