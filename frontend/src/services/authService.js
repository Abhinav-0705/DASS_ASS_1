import api from './api';

// Register participant
export const registerParticipant = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};
