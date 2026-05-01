import API from '../lib/api';

const TenantService = {
  getAll: async () => {
    const { data } = await API.get('/api/tenants');
    return data;
  },

  create: async (tenantData) => {
    const { data } = await API.post('/api/tenants', tenantData);
    return data;
  },

  moveOut: async (tenantId) => {
    const { data } = await API.put(`/api/tenants/${tenantId}/moveout`);
    return data;
  },

  giveNotice: async (tenantId, moveOutDate) => {
    const { data } = await API.post(`/api/tenants/${tenantId}/notice`, { moveOutDate });
    return data;
  }
};

export default TenantService;
