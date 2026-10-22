export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const SLOT_TYPES = {
  CAR: 'Standard Car',
  BIKE: 'Two-Wheeler / Bike',
  EV: 'EV Fast Charging',
  ACCESSIBLE: 'Wheelchair Accessible',
};

export const SLOT_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
};

export const PAYMENT_GATEWAYS = {
  RAZORPAY: 'Razorpay',
  UPI: 'UPI / QR Payment',
  CARD: 'Credit / Debit Card',
  NETBANKING: 'Net Banking',
};
