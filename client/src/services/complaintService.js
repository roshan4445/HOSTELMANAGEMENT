import API from '../lib/api';

const ComplaintService = {
  getAll: async () => {
    const { data } = await API.get('/api/complaints');
    return data;
  },

  create: async (complaintData) => {
    const { data } = await API.post('/api/complaints', complaintData);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await API.put(`/api/complaints/${id}`, { status });
    return data;
  },

  addComment: async (id, message) => {
    const { data } = await API.post(`/api/complaints/${id}/comment`, { message });
    return data;
  }
};

export default ComplaintService;
