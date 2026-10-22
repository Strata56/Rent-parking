import api from './api';

export const bookingService = {
  // Get all parking lots with optional search query & slot filter
  getParkingLots: async (query = '', slotType = '') => {
    const params = {};
    if (query) params.q = query;
    if (slotType) params.slot_type = slotType;
    const res = await api.get('/parking/lots', { params });
    return res.data;
  },

  // Get details for a specific lot and its slots
  getLotById: async (lotId) => {
    const res = await api.get(`/parking/lots/${lotId}`);
    return res.data;
  },

  // Create a new slot booking
  createBooking: async (bookingData) => {
    const res = await api.post('/booking/create', bookingData);
    return res.data;
  },

  // Get bookings for current user
  getMyBookings: async () => {
    const res = await api.get('/booking/my-bookings');
    return res.data;
  },

  // Cancel an existing booking
  cancelBooking: async (bookingId) => {
    const res = await api.post(`/booking/${bookingId}/cancel`);
    return res.data;
  },

  // Get all bookings (for operator dashboard)
  getAllBookings: async () => {
    const res = await api.get('/booking/all');
    return res.data;
  },

  // Update status of a specific slot (AVAILABLE, OCCUPIED, MAINTENANCE)
  updateSlotStatus: async (slotId, status) => {
    const res = await api.patch(`/parking/slots/${slotId}/status`, { status });
    return res.data;
  },

  // Scan QR code at barrier gate (ENTRY / EXIT)
  scanQRBarrier: async (qrCode, action = 'ENTRY', method = 'QR_CODE') => {
    const res = await api.post('/qr/scan', { qr_code: qrCode, action, method });
    return res.data;
  },

  // Create new parking lot (for operators)
  createLot: async (lotData) => {
    const res = await api.post('/parking/lots', lotData);
    return res.data;
  },

  // ----------------- User Vehicles (Database Persisted) ----------------- //

  // Get user's vehicles from database
  getVehicles: async () => {
    const res = await api.get('/vehicles');
    return res.data;
  },

  // Add new vehicle to database
  addVehicle: async (vehicleData) => {
    const res = await api.post('/vehicles', vehicleData);
    return res.data;
  },

  // Delete vehicle from database
  deleteVehicle: async (vehicleId) => {
    const res = await api.delete(`/vehicles/${vehicleId}`);
    return res.data;
  }
};
