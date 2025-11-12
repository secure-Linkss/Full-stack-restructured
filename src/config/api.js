// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
      validate: '/api/auth/validate',
      status: '/api/auth/status'
    },
    analytics: {
      overview: '/api/analytics/overview'
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default apiConfig;
