import api from './api';

// Create organizer
export const createOrganizer = async (organizerData) => {
  const response = await api.post('/admin/organizers', organizerData);
  return response.data;
};

// Get all organizers
export const getOrganizers = async () => {
  const response = await api.get('/admin/organizers');
  return response.data;
};

// Delete organizer
export const deleteOrganizer = async (organizerId) => {
  const response = await api.delete(`/admin/organizers/${organizerId}`);
  return response.data;
};

// Reset organizer password
export const resetOrganizerPassword = async (organizerId, newPassword) => {
  const response = await api.put(`/admin/organizers/${organizerId}/reset-password`, {
    newPassword,
  });
  return response.data;
};

// Get all participants
export const getParticipants = async () => {
  const response = await api.get('/admin/participants');
  return response.data;
};
