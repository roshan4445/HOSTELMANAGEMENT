import API from '../lib/api';

const PaymentService = {
  getAll: async (params = {}) => {
    const { data } = await API.get('/api/payments', { params });
    return data;
  },

  generateRent: async () => {
    const { data } = await API.post('/api/payments/generate');
    return data;
  },

  markPaid: async (paymentId, paymentMode = 'UPI') => {
    const { data } = await API.put(`/api/payments/${paymentId}/pay`, { paymentMode });
    return data;
  }
};

export default PaymentService;
