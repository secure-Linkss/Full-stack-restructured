/**
 * Admin Panel API Service
 * Centralizes all API calls for the admin panel
 */

const API_BASE = '/api/admin';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// User Management APIs
export const userApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (userId) => {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (userData) => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  update: async (userId, userData) => {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  changeRole: async (userId, role) => {
    const response = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse(response);
  },

  approve: async (userId) => {
    const response = await fetch(`${API_BASE}/users/${userId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  suspend: async (userId) => {
    const response = await fetch(`${API_BASE}/users/${userId}/suspend`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  changePassword: async (userId, newPassword) => {
    const response = await fetch(`${API_BASE}/users/${userId}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    });
    return handleResponse(response);
  },

  extendSubscription: async (userId, days) => {
    const response = await fetch(`${API_BASE}/users/${userId}/extend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ days })
    });
    return handleResponse(response);
  },

  delete: async (userId) => {
    const response = await fetch(`${API_BASE}/users/${userId}/delete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Campaign Management APIs
export const campaignApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/campaigns`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (campaignId) => {
    const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (campaignData) => {
    const response = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(campaignData)
    });
    return handleResponse(response);
  },

  update: async (campaignId, campaignData) => {
    const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(campaignData)
    });
    return handleResponse(response);
  },

  delete: async (campaignId) => {
    const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getLinks: async (campaignId) => {
    const response = await fetch(`${API_BASE}/campaigns/${campaignId}/links`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Analytics APIs
export const analyticsApi = {
  getUserAnalytics: async () => {
    const response = await fetch(`${API_BASE}/analytics/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getCampaignAnalytics: async () => {
    const response = await fetch(`${API_BASE}/analytics/campaigns`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getDashboardStats: async () => {
    // Fetch multiple endpoints and combine the data
    const [users, campaigns, userAnalytics, campaignAnalytics] = await Promise.all([
      userApi.getAll(),
      campaignApi.getAll(),
      analyticsApi.getUserAnalytics(),
      analyticsApi.getCampaignAnalytics()
    ]);

    // Calculate dashboard statistics
    const activeUsers = users.filter(u => u.status === 'active' || u.is_active).length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    
    return {
      totalUsers: users.length,
      activeUsers,
      pendingUsers: users.filter(u => u.status === 'pending').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      ...userAnalytics,
      ...campaignAnalytics
    };
  }
};

// Audit Log APIs
export const auditApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (logId) => {
    const response = await fetch(`${API_BASE}/audit-logs/${logId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Security APIs
export const securityApi = {
  getSettings: async () => {
    const response = await fetch('/api/security', {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateSettings: async (settings) => {
    const response = await fetch('/api/security/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(response);
  },

  blockIp: async (ip, reason) => {
    const response = await fetch('/api/security/blocked-ips', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ip, reason })
    });
    return handleResponse(response);
  },

  unblockIp: async (ip) => {
    const response = await fetch(`/api/security/blocked-ips/${ip}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  blockCountry: async (country, reason) => {
    const response = await fetch('/api/security/blocked-countries', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ country, reason })
    });
    return handleResponse(response);
  },

  unblockCountry: async (country) => {
    const response = await fetch(`/api/security/blocked-countries/${country}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const response = await fetch('/api/notifications', {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export default {
  user: userApi,
  campaign: campaignApi,
  analytics: analyticsApi,
  audit: auditApi,
  security: securityApi,
  notifications: notificationsApi
};
