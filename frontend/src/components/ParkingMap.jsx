import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ParkingMap({ lots = [], height = '450px', onSelectLot }) {
  if (!lots || lots.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-100 rounded-2xl border border-slate-200" style={{ height }}>
        <p className="text-slate-500 font-medium text-sm">No parking locations found</p>
      </div>
    );
  }

  const centerCoords = [lots[0]?.latitude || 19.076, lots[0]?.longitude || 72.877];

  return (
    <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-hidden" style={{ height }}>
      <MapContainer
        center={centerCoords}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {lots.map((lot) => (
          <Marker key={lot.lot_id} position={[lot.latitude, lot.longitude]}>
            <Popup>
              <div className="p-1 space-y-1.5 min-w-[200px]">
                <h4 className="font-bold text-sm text-slate-900">{lot.name}</h4>
                <p className="text-xs text-slate-500">{lot.address}</p>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
                  <span className="font-semibold text-emerald-600">{lot.available_slots} slots free</span>
                  <span className="font-bold text-blue-600">₹{lot.price_per_hour}/hr</span>
                </div>
                {onSelectLot ? (
                  <button
                    onClick={() => onSelectLot(lot)}
                    className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
                  >
                    Select Location
                  </button>
                ) : (
                  <Link
                    to={`/booking?lot_id=${lot.lot_id}`}
                    className="block text-center w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
                  >
                    Reserve Spot
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
