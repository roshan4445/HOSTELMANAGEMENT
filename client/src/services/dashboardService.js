import API from '../lib/api';

const DashboardService = {
  getStats: async () => {
    const { data } = await API.get('/api/dashboard');
    return data;
  }
};

export default DashboardService;
