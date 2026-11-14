import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';

// Commuter / driver pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import History from './pages/History';
import Profile from './pages/Profile';

// Operator console pages
import Dashboard from './pages/operator/Dashboard';
import ManageLots from './pages/operator/ManageLots';
import Bookings from './pages/operator/Bookings';
import ScanQR from './pages/operator/ScanQR';

/**
 * ProtectedRoute component that enforces authentication and role-based access control.
 * - Redirects unauthenticated visitors to /login.
 * - Redirects unauthorized roles to their respective home page:
 *     * Driver attempting operator route -> redirects to /home
 *     * Operator attempting driver route -> redirects to /operator/dashboard
 */
function ProtectedRoute({ allowedRoles, children }) {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role (commuter or missing role defaults to driver)
  const userRole = (user.role === 'commuter' || !user.role) ? 'driver' : user.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'operator' ? '/operator/dashboard' : '/home'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Driver parking exploration and booking flow (driver role only) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Facility operator console routes (operator role only) */}
        <Route
          path="/operator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/manage-lots"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <ManageLots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/bookings"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/scan"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <ScanQR />
            </ProtectedRoute>
          }
        />

        {/* Fallback unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
