import API from '../lib/api';

const AnnouncementService = {
  getAll: async () => {
    const { data } = await API.get('/api/announcements');
    return data;
  },

  create: async (announcementData) => {
    const { data } = await API.post('/api/announcements', announcementData);
    return data;
  },

  update: async (id, announcementData) => {
    const { data } = await API.put(`/api/announcements/${id}`, announcementData);
    return data;
  },

  delete: async (id) => {
    const { data } = await API.delete(`/api/announcements/${id}`);
    return data;
  },

  markAsRead: async (id) => {
    const { data } = await API.post(`/api/announcements/${id}/read`);
    return data;
  }
};

export default AnnouncementService;
