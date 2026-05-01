import API from '../lib/api';

const RoomService = {
  getAll: async () => {
    const { data } = await API.get('/api/rooms');
    return data;
  },

  create: async (roomData) => {
    const { data } = await API.post('/api/rooms', roomData);
    return data;
  },

  getPublic: async (pgName) => {
    const { data } = await API.get(`/api/rooms/public/${pgName}`);
    return data;
  }
};

export default RoomService;
