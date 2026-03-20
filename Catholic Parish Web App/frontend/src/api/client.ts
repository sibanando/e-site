import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: unknown) => api.post('/auth/users', data),
  updateUser: (id: string, data: unknown) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

// Families
export const familiesApi = {
  list: (params?: Record<string, unknown>) => api.get('/families', { params }),
  get: (id: string) => api.get(`/families/${id}`),
  create: (data: unknown) => api.post('/families', data),
  update: (id: string, data: unknown) => api.put(`/families/${id}`, data),
  delete: (id: string) => api.delete(`/families/${id}`),
  addMember: (id: string, data: unknown) => api.post(`/families/${id}/members`, data),
};

// People
export const peopleApi = {
  list: (params?: Record<string, unknown>) => api.get('/people', { params }),
  get: (id: string) => api.get(`/people/${id}`),
  create: (data: unknown) => api.post('/people', data),
  update: (id: string, data: unknown) => api.put(`/people/${id}`, data),
  delete: (id: string) => api.delete(`/people/${id}`),
};

// Sacraments
export const sacramentsApi = {
  types: () => api.get('/sacraments/types'),
  list: (params?: Record<string, unknown>) => api.get('/sacraments', { params }),
  get: (id: string) => api.get(`/sacraments/${id}`),
  create: (data: unknown) => api.post('/sacraments', data),
  update: (id: string, data: unknown) => api.put(`/sacraments/${id}`, data),
};

// Certificates
export const certificatesApi = {
  getTemplates: () => api.get('/certificates/templates'),
  createTemplate: (data: unknown) => api.post('/certificates/templates', data),
  updateTemplate: (id: string, data: unknown) => api.put(`/certificates/templates/${id}`, data),
  generate: (data: unknown) => api.post('/certificates', data),
  get: (id: string) => api.get(`/certificates/${id}`),
  getRequests: () => api.get('/certificates/requests'),
  createRequest: (data: unknown) => api.post('/certificates/requests', data),
  updateRequest: (id: string, data: unknown) => api.patch(`/certificates/requests/${id}`, data),
  verify: (token: string) => api.get(`/certificates/verify/${token}`),
};

// Admin
export const adminApi = {
  auditLog: (params?: Record<string, unknown>) => api.get('/admin/audit-log', { params }),
  reports: (params?: Record<string, unknown>) => api.get('/admin/reports', { params }),
  parishSettings: () => api.get('/admin/parish-settings'),
  updateParishSettings: (data: unknown) => api.put('/admin/parish-settings', data),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post('/admin/parish-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
