// Enhanced API Service with Better Error Handling and Debugging
// This replaces api.js with improved authentication error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to check if token exists and is valid format
const isTokenValid = (token) => {
  if (!token) return false;
  // Basic JWT format check (should have 3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

// Helper function to handle token expiration
const handleTokenExpiration = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Redirect to login if not already there
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?expired=true';
  }
};

// Enhanced fetch with better error handling
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  // Check if token exists
  if (!token) {
    console.error('[API] No authentication token found');
    handleTokenExpiration();
    throw new Error('Authentication required. Please log in.');
  }
  
  // Check if token has valid format
  if (!isTokenValid(token)) {
    console.error('[API] Invalid token format');
    handleTokenExpiration();
    throw new Error('Invalid authentication token. Please log in again.');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  headers['Authorization'] = `Bearer ${token}`;
  
  // Log API request for debugging (can be disabled in production)
  if (import.meta.env.DEV) {
    console.log(`[API] ${options.method || 'GET'} ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for CORS with credentials
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('[API] 401 Unauthorized - Token invalid or expired');
      handleTokenExpiration();
      throw new Error('Session expired. Please log in again.');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      console.error('[API] 403 Forbidden - Insufficient permissions');
      throw new Error('You do not have permission to access this resource.');
    }

    // Handle 404 Not Found
    if (response.status === 404) {
      console.error(`[API] 404 Not Found - ${url}`);
      throw new Error('The requested resource was not found.');
    }

    // Handle 500 Server Error
    if (response.status >= 500) {
      console.error(`[API] ${response.status} Server Error`);
      throw new Error('Server error. Please try again later.');
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `Request failed with status ${response.status}` 
      }));
      console.error('[API] Error Response:', error);
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    // Success - return parsed JSON
    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log(`[API] ✓ Success:`, data);
    }
    
    return data;
    
  } catch (error) {
    // Network error (no internet, CORS, etc.)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('[API] Network Error - Cannot reach server');
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    
    // Re-throw our custom errors
    throw error;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error('[API] Health check failed:', error);
    return false;
  }
};

// Export the same API structure as before but with enhanced error handling
const api = {
  // Health check
  health: {
    check: healthCheck,
  },

  // ==================== AUTH APIs ====================
  auth: {
    login: async (credentials) => {
      // Login doesn't need auth token
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Invalid credentials');
      }
      
      return response.json();
    },
    register: (userData) => fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(res => res.json()),
    logout: () => fetchWithAuth(`${API_BASE_URL}/auth/logout`, { method: 'POST' }),
    getCurrentUser: () => fetchWithAuth(`${API_BASE_URL}/user/profile`),
  },

  // ==================== DASHBOARD APIs ====================
  dashboard: {
    getMetrics: async (dateRange = '7d') => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=${dateRange}`);
        // Transform response to match Dashboard expectations
        return {
          totalLinks: response.totalLinks || 0,
          totalClicks: response.totalClicks || 0,
          realVisitors: response.realVisitors || 0,
          capturedEmails: response.capturedEmails || 0,
          activeLinks: response.activeLinks || 0,
          conversionRate: response.conversionRate || 0,
          avgClicksPerLink: Math.round((response.totalClicks || 0) / (response.totalLinks || 1)),
          countries: response.topCountries?.length || 0,
          // Calculate changes (compare with previous period)
          totalLinksChange: response.totalLinksChange || 0,
          totalClicksChange: response.totalClicksChange || 0,
          realVisitorsChange: response.realVisitorsChange || 0,
          capturedEmailsChange: response.capturedEmailsChange || 0,
          activeLinksChange: response.activeLinksChange || 0,
          conversionRateChange: response.conversionRateChange || 0,
          avgClicksPerLinkChange: response.avgClicksPerLinkChange || 0
        };
      } catch (error) {
        console.error('[Dashboard] Failed to get metrics:', error);
        throw error;
      }
    },
    getPerformanceOverTime: async (days = 30) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=${days}d`);
      const perfData = response.performanceOverTime || [];
      return {
        labels: perfData.map(d => d.date || d.label),
        clicks: perfData.map(d => d.clicks || 0),
        visitors: perfData.map(d => d.visitors || d.realVisitors || 0),
        emailCaptures: perfData.map(d => d.emailCaptures || d.emails || 0)
      };
    },
    getDeviceBreakdown: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=30d`);
      const deviceData = response.deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0 };
      return {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        data: [
          Math.round(deviceData.desktop || 0),
          Math.round(deviceData.mobile || 0),
          Math.round(deviceData.tablet || 0)
        ]
      };
    },
    getTopCountries: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=30d`);
      return (response.topCountries || []).map(country => ({
        name: country.country || country.name,
        flag: country.flag || '',
        clicks: country.clicks || 0,
        emails: country.emails || 0,
        percentage: country.percentage || 0
      }));
    },
    getCampaignPerformance: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=30d`);
      return (response.campaignPerformance || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        clicks: campaign.clicks || 0,
        conversions: campaign.emails || campaign.conversions || 0,
        conversionRate: campaign.conversion || campaign.conversionRate || '0%',
        status: campaign.status || 'active'
      }));
    },
    getRecentCaptures: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=30d`);
      return (response.recentCaptures || []).map(capture => ({
        email: capture.email,
        link: capture.campaign || capture.link,
        timestamp: capture.time || capture.timestamp,
        country: capture.country || 'Unknown'
      }));
    },
  },

  // ... Copy all other API methods from original api.js but use fetchWithAuth ...
  // (The rest of the API methods remain the same but will benefit from enhanced error handling)
};

// Copy all remaining API sections from original api.js
// This is just showing the enhanced error handling structure
// The full implementation would include all endpoints from the original file

export default api;

export { healthCheck };
