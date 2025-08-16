import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Vendor API functions
export const vendorAPI = {
  getAll: (params) => api.get('/api/vendors', { params }),
  getById: (id) => api.get(`/api/vendors/${id}`),
  create: (data) => api.post('/api/vendors', data),
  update: (id, data) => api.put(`/api/vendors/${id}`, data),
  delete: (id) => api.delete(`/api/vendors/${id}`),
  addContract: (id, data) => api.post(`/api/vendors/${id}/contracts`, data),
  updateContract: (id, contractId, data) => api.put(`/api/vendors/${id}/contracts/${contractId}`, data),
  addDataType: (id, data) => api.post(`/api/vendors/${id}/data-types`, data),
  addReview: (id, data) => api.post(`/api/vendors/${id}/reviews`, data),
  getStats: (id) => api.get(`/api/vendors/${id}/stats`),
};

// User API functions
export const userAPI = {
  getAll: (params) => api.get('/api/users', { params }),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
  resetPassword: (id, data) => api.post(`/api/users/${id}/reset-password`, data),
  getStats: () => api.get('/api/users/stats/overview'),
};

// Tenant API functions
export const tenantAPI = {
  getCurrent: () => api.get('/api/tenants/current'),
  update: (data) => api.put('/api/tenants/current', data),
  getStats: () => api.get('/api/tenants/stats'),
  getVendorTypes: () => api.get('/api/tenants/stats/vendor-types'),
  getRiskLevels: () => api.get('/api/tenants/stats/risk-levels'),
  getContractValues: () => api.get('/api/tenants/stats/contract-values'),
  getActivity: () => api.get('/api/tenants/activity'),
};

// Auth API functions
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
};
