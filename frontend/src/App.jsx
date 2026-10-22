import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Commuter / general pages
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
import ScanQR from './pages/operator/ScanQR';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main landing page is the Login screen */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User parking exploration and booking flow */}
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />

        {/* Facility operator routes */}
        <Route path="/operator/dashboard" element={<Dashboard />} />
        <Route path="/operator/manage-lots" element={<ManageLots />} />
        <Route path="/operator/scan" element={<ScanQR />} />

        {/* Fallback unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
