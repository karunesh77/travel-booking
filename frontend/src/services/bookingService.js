import api from './api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  list: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),

  uploadDocuments: (bookingId, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('documents', f));
    return api.post(`/documents/booking/${bookingId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDocument: (docId) => api.delete(`/documents/${docId}`),
  getDocument: (docId) => api.get(`/documents/${docId}`),
};
