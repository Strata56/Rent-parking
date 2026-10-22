import api from './api';

export const paymentService = {
  // Create payment order
  createOrder: async (bookingId, amount) => {
    const res = await api.post('/payment/create-order', {
      booking_id: bookingId,
      amount: amount,
      gateway: 'RAZORPAY'
    });
    return res.data;
  },

  // Verify payment after completion
  verifyPayment: async (paymentData) => {
    const res = await api.post('/payment/verify', paymentData);
    return res.data;
  },

  // Get past payments
  getPaymentHistory: async () => {
    const res = await api.get('/payment/history');
    return res.data;
  }
};
