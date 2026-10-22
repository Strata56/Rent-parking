import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Car, User, LogOut, LayoutDashboard, QrCode } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to={user ? "/home" : "/"} className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-500 transition">
              P
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                SmartPark
              </span>
              <span className="block text-[11px] text-slate-400">Real-Time Parking & Reservation</span>
            </div>
          </Link>

          {/* Nav links */}
          {user ? (
            <div className="flex items-center space-x-6">
              <Link to="/home" className="text-sm font-medium text-slate-300 hover:text-white transition">
                Map & Lots
              </Link>
              <Link to="/search" className="text-sm font-medium text-slate-300 hover:text-white transition">
                Search
              </Link>
              <Link to="/history" className="text-sm font-medium text-slate-300 hover:text-white transition">
                My Bookings
              </Link>
              <Link to="/profile" className="text-sm font-medium text-slate-300 hover:text-white transition">
                Vehicles
              </Link>

              {user.role === 'operator' && (
                <Link
                  to="/operator/dashboard"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/50 text-xs font-semibold uppercase tracking-wider transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Operator Console</span>
                </Link>
              )}

              {/* User info & logout */}
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-700">
                <div className="text-right">
                  <span className="block text-sm font-semibold text-slate-200">{user.name}</span>
                  <span className="block text-xs text-blue-400 capitalize">{user.role === 'commuter' ? 'Driver' : (user.role || 'Driver')}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-sm transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-semibold text-slate-300 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
