import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState('driver'); // 'driver' or 'operator'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await authService.login(email.trim(), password);
      
      // Navigate to corresponding area based on role
      if (data.user?.role === 'operator') {
        navigate('/operator/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    setError('');
    // Helpful prefill for quick switching between driver and operator
    if (role === 'operator') {
      setEmail('operator@parking.com');
    } else {
      setEmail('sarthak@example.com');
    }
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900">
      {/* Left Column: Exactly matching reference image with #2f7bc4 and car illustration */}
      <div className="lg:w-1/2 bg-[#2f7bc4] text-white flex flex-col justify-between relative overflow-hidden">
        {/* Upper content */}
        <div className="p-8 sm:p-12 lg:p-16 z-10">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-2 mb-10 lg:mb-16">
            <span className="text-2xl font-bold tracking-tight text-white">
              Smart<span className="text-amber-400 font-black">Park</span>
            </span>
          </div>

          {/* Hero Headline & Features */}
          <div className="max-w-lg space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight text-white">
              Find a parking spot <br />
              before you reach.
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed pt-1">
              Check live slot availability, book in advance and pay online. No cash, no paper tickets.
            </p>

            {/* Checklist */}
            <div className="space-y-3.5 pt-4 text-sm sm:text-base font-medium text-white">
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-black text-lg leading-none">✓</span>
                <span>Live slot availability</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-black text-lg leading-none">✓</span>
                <span>Book in advance</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-black text-lg leading-none">✓</span>
                <span>Cashless payment</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-black text-lg leading-none">✓</span>
                <span>QR code entry and exit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Vector Illustration (Sedan Car & Parking Sign on Road) */}
        <div className="w-full mt-auto pt-6">
          <svg 
            viewBox="0 0 540 180" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full max-w-xl mx-auto block select-none pointer-events-none"
          >
            {/* Road Asphalt */}
            <rect y="125" width="540" height="55" fill="#1f5f9f" />
            
            {/* Road Markings */}
            <rect x="15" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />
            <rect x="95" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />
            <rect x="175" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />
            <rect x="255" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />
            <rect x="335" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />
            <rect x="415" y="152" width="55" height="6" rx="3" fill="white" fillOpacity="0.45" />

            {/* Parking Sign Post */}
            <rect x="442" y="70" width="7" height="60" fill="white" rx="1" />
            <rect x="426" y="32" width="38" height="38" rx="8" fill="white" />
            <text x="445" y="60" fill="#2f7bc4" fontSize="25" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">P</text>

            {/* White Sedan Car */}
            <g>
              {/* Lower Body */}
              <rect x="35" y="82" width="340" height="44" rx="8" fill="white" />

              {/* Cabin & Roof */}
              <path d="M 75 82 L 125 36 L 275 36 L 315 82 Z" fill="white" />

              {/* Rear Red Light & Front Amber Light */}
              <rect x="35" y="90" width="8" height="15" rx="3" fill="#ef4444" />
              <rect x="367" y="90" width="8" height="15" rx="3" fill="#f59e0b" />

              {/* Tinted Windows */}
              <path d="M 128 78 L 145 42 L 195 42 L 195 78 Z" fill="#1f5f9f" />
              <path d="M 203 78 L 203 42 L 268 42 L 305 78 Z" fill="#1f5f9f" />

              {/* Door Handles */}
              <rect x="165" y="92" width="16" height="4" rx="2" fill="#cbd5e1" />
              <rect x="238" y="92" width="16" height="4" rx="2" fill="#cbd5e1" />

              {/* Wheel Well Arches */}
              <circle cx="95" cy="126" r="28" fill="#1f5f9f" />
              <circle cx="285" cy="126" r="28" fill="#1f5f9f" />

              {/* Wheels (Tires & Rims) */}
              <circle cx="95" cy="126" r="21" fill="#0f172a" />
              <circle cx="95" cy="126" r="13" fill="#cbd5e1" />
              <circle cx="95" cy="126" r="5" fill="#0f172a" />

              <circle cx="285" cy="126" r="21" fill="#0f172a" />
              <circle cx="285" cy="126" r="13" fill="#cbd5e1" />
              <circle cx="285" cy="126" r="5" fill="#0f172a" />
            </g>
          </svg>

          {/* Footer Copyright */}
          <div className="bg-[#1f5f9f] px-8 sm:px-12 pb-4 pt-1 text-[11px] text-blue-200">
            © 2026 SmartPark. Final Year Project
          </div>
        </div>
      </div>

      {/* Right Column: Exact Login Form from Image 2 */}
      <div className="lg:w-1/2 bg-slate-50/60 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2f7bc4] text-white font-black text-2xl shadow-sm mb-3">
              P
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              SmartPark
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage parking reservations and digital passes
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200/90 rounded-2xl shadow-sm space-y-5">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Sign in as
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('driver')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    selectedRole === 'driver'
                      ? 'bg-white text-[#2f7bc4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('operator')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    selectedRole === 'operator'
                      ? 'bg-white text-[#2f7bc4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Parking Operator
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2f7bc4] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset: Please contact your facility administrator or sign up with a new account.')}
                    className="text-xs text-[#2f7bc4] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2f7bc4] focus:ring-2 focus:ring-blue-100 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#2f7bc4] focus:ring-[#2f7bc4]"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2f7bc4] hover:bg-[#2569a8] active:bg-[#1e588f] text-white font-semibold text-sm shadow-xs transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Registration Link */}
            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#2f7bc4] hover:underline font-semibold underline-offset-2">
                Create an account
              </Link>
            </div>

            {/* Subtle demo credential helper */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>SmartPark Management System</span>
              <button
                type="button"
                onClick={() => {
                  setEmail(selectedRole === 'operator' ? 'operator@parking.com' : 'sarthak@example.com');
                  setPassword('password123');
                }}
                className="text-[#2f7bc4] hover:underline"
              >
                Fill Demo Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
