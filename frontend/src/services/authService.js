import api from './api';

export const authService = {
  // Login user or operator
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Register new account
  register: async (name, email, password, phone = '', role = 'driver') => {
    const res = await api.post('/auth/register', { name, email, password, phone, role });
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Get current logged-in user profile
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  // Log out and clear session
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
