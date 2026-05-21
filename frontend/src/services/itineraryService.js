import api from './api';

export const itineraryService = {
  generate: (bookingId) => api.post(`/itineraries/generate/${bookingId}`),
  list: (params) => api.get('/itineraries', { params }),
  get: (id) => api.get(`/itineraries/${id}`),
  update: (id, data) => api.put(`/itineraries/${id}`, data),
  delete: (id) => api.delete(`/itineraries/${id}`),

  share: (id, settings) => api.post(`/share/itineraries/${id}`, settings),
  revokeShare: (id) => api.delete(`/share/itineraries/${id}`),
  getShared: (shareToken) => api.get(`/share/${shareToken}`),
  getComments: (shareToken) => api.get(`/share/${shareToken}/comments`),
  addComment: (shareToken, data) => api.post(`/share/${shareToken}/comments`, data),
};
