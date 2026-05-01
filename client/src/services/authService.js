import API from '../lib/api';

const AuthService = {
  login: async (email, password) => {
    const { data } = await API.post('/api/auth/login', { email, password });
    return data;
  },

  register: async (name, email, password, pgName, role = 'owner') => {
    const { data } = await API.post('/api/auth/register', { name, email, password, pgName, role });
    return data;
  }
};

export default AuthService;
