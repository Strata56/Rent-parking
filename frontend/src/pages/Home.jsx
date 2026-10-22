import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import Navbar from '../components/Navbar';
import ParkingMap from '../components/ParkingMap';
import { Search, MapPin, Zap, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [slotType, setSlotType] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch parking facilities
  useEffect(() => {
    const loadLots = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getParkingLots(searchTerm, slotType);
        setLots(data);
      } catch (err) {
        console.error('Failed to load lots:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLots();
  }, [searchTerm, slotType]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 sm:p-12 text-white shadow-xl overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Guaranteed Parking Spot in Seconds
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Find, Reserve & Park <br />
              <span className="text-blue-200">With Real-Time Bay Status</span>
            </h1>
            <p className="text-sm text-blue-100">
              Select an available bay, confirm your booking, and enter seamlessly with an optical QR pass.
            </p>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="pt-2 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by facility name, BKC, Airport, Metro..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 font-medium text-sm shadow-md placeholder-slate-400 focus:outline-hidden"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 font-semibold text-sm text-white shadow-md transition"
              >
                Search
              </button>
            </form>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: 'All Bays', val: '' },
                { label: 'Cars', val: 'CAR' },
                { label: 'EV Charging', val: 'EV' },
                { label: 'Bikes', val: 'BIKE' },
                { label: 'Accessible', val: 'ACCESSIBLE' },
              ].map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setSlotType(f.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    slotType === f.val
                      ? 'bg-white text-blue-800 shadow'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map View */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Live Mumbai Parking Map
            </h2>
            <span className="text-xs text-slate-500 font-medium">Click markers for details</span>
          </div>
          <ParkingMap lots={lots} height="400px" />
        </div>

        {/* Facility Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Available Facilities ({lots.length})
            </h2>
            <Link to="/search" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Locations
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Loading nearby facilities...
            </div>
          ) : lots.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              No parking facilities match your search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {lots.map((lot) => (
                <div
                  key={lot.lot_id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {lot.available_slots} Open Bays
                      </span>
                      <span className="font-bold text-sm text-blue-600">
                        ₹{lot.price_per_hour}/hr
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{lot.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {lot.address}
                      </p>
                    </div>

                    <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 flex justify-between">
                      <span>Total Bays: {lot.total_slots}</span>
                      <span className="text-slate-700 font-medium">Security & ANPR</span>
                    </div>
                  </div>

                  <Link
                    to={`/booking?lot_id=${lot.lot_id}`}
                    className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    Select & Reserve Bay
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
