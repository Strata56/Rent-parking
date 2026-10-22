import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import Navbar from '../components/Navbar';
import { Search as SearchIcon, MapPin, ArrowRight, Filter } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [slotType, setSlotType] = useState('');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getParkingLots(query, slotType);
        setLots(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, slotType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Parking Facilities</h1>
          <p className="text-xs text-slate-500 mt-1">Filter by locality, landmark, or specific vehicle bay type</p>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by facility name or location (e.g. BKC, Andheri, Airport)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500"
            />
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden text-slate-700"
            >
              <option value="">All Bay Types</option>
              <option value="CAR">Car Bays</option>
              <option value="EV">EV Fast Charging</option>
              <option value="BIKE">Two-Wheelers</option>
              <option value="ACCESSIBLE">Wheelchair Accessible</option>
            </select>
          </div>
        </div>

        {/* Results list */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Searching parking lots...</div>
        ) : lots.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 text-slate-500 text-sm">
            No parking facilities found matching "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => (
              <div
                key={lot.lot_id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {lot.available_slots} Available Bays
                    </span>
                    <span className="font-bold text-sm text-blue-600">
                      ₹{lot.price_per_hour}/hr
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{lot.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {lot.address}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/booking?lot_id=${lot.lot_id}`}
                  className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  Book Bay Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
