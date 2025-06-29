import axios from 'axios';
import { getToken, removeToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
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
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

// Itinerary APIs
export const itineraryAPI = {
  generate: (data) => api.post('/api/itinerary/generate', data),
  getAll: (params) => api.get('/api/itinerary', { params }),
  getById: (id) => api.get(`/api/itinerary/${id}`),
  update: (id, data) => api.put(`/api/itinerary/${id}`, data),
  delete: (id) => api.delete(`/api/itinerary/${id}`),
  optimizeBudget: (id, data) => api.post(`/api/itinerary/${id}/optimize-budget`, data),
};

// Booking APIs
export const bookingAPI = {
  create: (data) => api.post('/api/booking', data),
  getAll: (params) => api.get('/api/booking', { params }),
  getById: (id) => api.get(`/api/booking/${id}`),
  updateStatus: (id, status) => api.put(`/api/booking/${id}/status`, { status }),
  cancel: (id) => api.put(`/api/booking/${id}/cancel`),
  processPayment: (id, data) => api.post(`/api/booking/${id}/payment`, data),
};

export default api;