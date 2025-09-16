import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Types
interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

interface VideoQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

interface VideoUpdateData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  category?: string;
  visibility?: 'public' | 'private' | 'unlisted';
}

interface StreamQueryParams {
  page?: number;
  limit?: number;
  status?: 'live' | 'ended' | 'scheduled';
}

interface StreamData {
  title: string;
  description?: string;
  scheduledAt?: string;
  settings?: Record<string, unknown>;
}

interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  preferences?: Record<string, unknown>;
}

interface SettingsData {
  // Brand settings
  logo_url?: string;
  brand_color?: string;
  watermark_url?: string;
  watermark_position?: string;
  custom_domain?: string;
  custom_css?: string;
  player_skin?: string;
  
  // Share settings
  default_privacy?: 'private' | 'public' | 'unlisted';
  allow_embedding?: boolean;
  require_password?: boolean;
  enable_social_sharing?: boolean;
  auto_generate_thumbnails?: boolean;
  thumbnail_count?: number;
  
  // General settings
  notifications?: Record<string, boolean>;
  privacy?: Record<string, unknown>;
  streaming?: Record<string, unknown>;
  storage?: Record<string, unknown>;
}

interface BillingData {
  planId?: string;
  paymentMethod?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
const ENABLE_API_LOGGING = import.meta.env.VITE_ENABLE_API_LOGGING === 'true';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    

    
    return config;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {

    return response;
  },
  (error) => {

    
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const apiClient = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      api.post('/api/auth/login', { login: email, password }),
    register: (email: string, password: string, username: string, first_name: string, last_name: string) => 
      api.post('/api/auth/register', { email, password, username, first_name, last_name }),
    logout: () => 
      api.post('/api/auth/logout'),
    refreshToken: () => 
      api.post('/api/auth/refresh'),
    getProfile: () => 
      api.get('/api/auth/me'),
    updateProfile: (data: ProfileUpdateData) => 
      api.put('/api/auth/profile', data),
    forgotPassword: (email: string) => 
      api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => 
      api.post('/api/auth/reset-password', { token, password }),
  },
  
  // Video endpoints
  videos: {
    getAll: (params?: VideoQueryParams) => 
      api.get('/api/videos', { params }),
    getMyVideos: (params?: { page?: number; limit?: number; status?: string; search?: string }) => 
      api.get('/api/videos/my-videos', { params }),
    getById: (id: string) => 
      api.get(`/api/videos/${id}`),
    create: (data: FormData) => 
      api.post('/api/videos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    update: (id: string, data: VideoUpdateData) => 
      api.put(`/api/videos/${id}`, data),
    delete: (id: string) => 
      api.delete(`/api/videos/${id}`),
    getUploadUrl: (filename: string, contentType: string) => 
      api.post('/api/videos/upload-url', { filename, contentType }),
    processVideo: (id: string) => 
      api.post(`/api/videos/${id}/process`),
    getAnalytics: (id: string, timeframe?: string) => 
      api.get(`/api/videos/${id}/analytics`, { params: { timeframe } }),
    getProcessingLogs: (id: string) => 
      api.get(`/api/videos/${id}/processing-logs`),
    incrementViews: (id: string) => 
      api.post(`/api/videos/${id}/increment-views`),
  },
  
  // Live streaming endpoints
  streams: {
    getAll: (params?: StreamQueryParams) => 
      api.get('/api/streams', { params }),
    getById: (id: string) => 
      api.get(`/api/streams/${id}`),
    create: (data: StreamData) => 
      api.post('/api/streams', data),
    update: (id: string, data: StreamData) => 
      api.put(`/api/streams/${id}`, data),
    delete: (id: string) => 
      api.delete(`/api/streams/${id}`),
    start: (id: string) => 
      api.post(`/api/streams/${id}/start`),
    stop: (id: string) => 
      api.post(`/api/streams/${id}/stop`),
    getStats: (id: string) => 
      api.get(`/api/streams/${id}/stats`),
  },
  
  // Analytics endpoints
  analytics: {
    getDashboard: (timeframe?: string) => 
      api.get('/api/analytics/dashboard', { params: { timeframe } }),
    getVideoStats: (videoId: string, timeframe?: string) => 
      api.get(`/api/analytics/videos/${videoId}`, { params: { timeframe } }),
    getStreamStats: (streamId: string, timeframe?: string) => 
      api.get(`/api/analytics/streams/${streamId}`, { params: { timeframe } }),
    getBandwidthUsage: (timeframe?: string) => 
      api.get('/api/analytics/bandwidth', { params: { timeframe } }),
    getStorageUsage: () => 
      api.get('/api/analytics/storage'),
  },
  
  // User management endpoints
  users: {
    getAll: (params?: UserQueryParams) => 
      api.get('/api/users', { params }),
    getById: (id: string) => 
      api.get(`/api/users/${id}`),
    update: (id: string, data: UserUpdateData) => 
      api.put(`/api/users/${id}`, data),
    delete: (id: string) => 
      api.delete(`/api/users/${id}`),
    updatePlan: (id: string, planId: string) => 
      api.put(`/api/users/${id}/plan`, { planId }),
  },
  
  // Settings endpoints
  settings: {
    get: () => 
      api.get('/api/settings'),
    update: (data: SettingsData) => 
      api.put('/api/settings', data),
    getBilling: () => 
      api.get('/api/settings/billing'),
    updateBilling: (data: BillingData) => 
      api.put('/api/settings/billing', data),
  },
  
  // Health check
  health: () => 
    api.get('/api/health'),
};

export default api;
export { API_BASE_URL, API_TIMEOUT, ENABLE_API_LOGGING };
