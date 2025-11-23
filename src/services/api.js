// Real API Service for Brain Link Tracker
// Replaces mockApi.js with actual backend API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.warn('[API] No authentication token found in storage');
  }
  return token;
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API] Request with token:', url);
  } else {
    console.warn('[API] Request WITHOUT token:', url);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session-based auth
    });

    console.log(`[API] Response status for ${url}:`, response.status);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('[API] 401 Unauthorized - Authentication failed');
      console.error('[API] Token in storage:', token ? 'EXISTS' : 'MISSING');
      console.error('[API] Request URL:', url);
      
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        console.log('[API] Redirecting to login...');
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      console.error('[API] Request failed:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Request successful:', url);
    return data;
  } catch (error) {
    console.error('[API] Request error:', error.message);
    throw error;
  }
};

// API Service Object
const api = {
  // ==================== AUTH APIs ====================
  auth: {
    login: async (credentials) => {
      console.log('[API] Login attempt for:', credentials.username);
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Store token if present in response
      if (response.token) {
        localStorage.setItem('token', response.token);
        console.log('[API] Token stored successfully');
      } else if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        console.log('[API] Access token stored successfully');
      } else {
        console.warn('[API] No token in login response:', Object.keys(response));
      }
      
      return response;
    },
    register: (userData) => fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    logout: () => {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      console.log('[API] Token cleared on logout');
      return fetchWithAuth(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    },
    getCurrentUser: () => fetchWithAuth(`${API_BASE_URL}/user/profile`),
  },

  // ==================== DASHBOARD APIs ====================
  dashboard: {
    getMetrics: async (dateRange = '7d') => {
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

  // ==================== TRACKING LINKS APIs ====================
  links: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`${API_BASE_URL}/links?${params}`);
    },
    getById: (id) => fetchWithAuth(`${API_BASE_URL}/links/${id}`),
    create: (linkData) => fetchWithAuth(`${API_BASE_URL}/links`, {
      method: 'POST',
      body: JSON.stringify(linkData),
    }),
    update: (id, linkData) => fetchWithAuth(`${API_BASE_URL}/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(linkData),
    }),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/links/${id}`, { method: 'DELETE' }),
    getAnalytics: (id) => fetchWithAuth(`${API_BASE_URL}/links/${id}/analytics`),
    bulkDelete: (ids) => fetchWithAuth(`${API_BASE_URL}/links/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  },

  // ==================== ANALYTICS APIs ====================
  analytics: {
    getOverview: (dateRange) => fetchWithAuth(`${API_BASE_URL}/analytics/overview?period=${dateRange}`),
    getClicksOverTime: (dateRange) => fetchWithAuth(`${API_BASE_URL}/analytics/performance?period=${dateRange}`),
    getVisitorsOverTime: (dateRange) => fetchWithAuth(`${API_BASE_URL}/analytics/performance?period=${dateRange}`),
    getGeography: () => fetchWithAuth(`${API_BASE_URL}/analytics/geography`),
    getDevices: () => fetchWithAuth(`${API_BASE_URL}/analytics/overview`).then(data => data.devices),
    getBrowsers: () => fetchWithAuth(`${API_BASE_URL}/analytics/overview`), // Placeholder
    getOperatingSystems: () => fetchWithAuth(`${API_BASE_URL}/analytics/overview`), // Placeholder
    exportData: (format = 'csv') => fetchWithAuth(`${API_BASE_URL}/analytics/export?format=${format}`),
  },

  // ==================== CAMPAIGNS APIs ====================
  campaigns: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/campaigns`),
    getById: (id) => fetchWithAuth(`${API_BASE_URL}/campaigns/${id}`),
    create: (campaignData) => fetchWithAuth(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(campaignData),
    }),
    update: (id, campaignData) => fetchWithAuth(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    }),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/campaigns/${id}`, { method: 'DELETE' }),
    getPerformance: (id) => fetchWithAuth(`${API_BASE_URL}/campaigns/${id}/performance`),
  },

  // ==================== LIVE ACTIVITY APIs ====================
  liveActivity: {
    getEvents: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`${API_BASE_URL}/events/live?${params}`);
    },
    getEventDetails: (eventId) => fetchWithAuth(`${API_BASE_URL}/events/${eventId}`),
    blockIP: (ip) => fetchWithAuth(`${API_BASE_URL}/security/block-ip`, {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),
  },

  // ==================== GEOGRAPHY APIs ====================
  geography: {
    getCountries: () => fetchWithAuth(`${API_BASE_URL}/analytics/geography`).then(data => data.countries),
    getRegions: (country) => fetchWithAuth(`${API_BASE_URL}/analytics/geography`), // Placeholder
    getCities: (country, region) => fetchWithAuth(`${API_BASE_URL}/analytics/geography`).then(data => data.cities),
    getGeoFencing: (linkId) => fetchWithAuth(`${API_BASE_URL}/links/${linkId}/geo-fencing`),
    updateGeoFencing: (linkId, settings) => fetchWithAuth(`${API_BASE_URL}/links/${linkId}/geo-fencing`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  },

  // ==================== SECURITY APIs ====================
  security: {
    getSettings: () => fetchWithAuth(`${API_BASE_URL}/security/settings`),
    updateSettings: (settings) => fetchWithAuth(`${API_BASE_URL}/security/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    enable2FA: () => fetchWithAuth(`${API_BASE_URL}/security/2fa/enable`, { method: 'POST' }),
    disable2FA: (code) => fetchWithAuth(`${API_BASE_URL}/security/2fa/disable`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
    getSessions: () => fetchWithAuth(`${API_BASE_URL}/security/sessions`),
    revokeSession: (sessionId) => fetchWithAuth(`${API_BASE_URL}/security/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
    getLoginHistory: () => fetchWithAuth(`${API_BASE_URL}/security/login-history`),
    getThreats: () => fetchWithAuth(`${API_BASE_URL}/security/threats`),
  },

  // ==================== PROFILE APIs ====================
  profile: {
    get: () => fetchWithAuth(`${API_BASE_URL}/user/profile`),
    update: (profileData) => fetchWithAuth(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    uploadAvatar: (formData) => {
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/user/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      }).then(res => res.json());
    },
    changePassword: (passwordData) => fetchWithAuth(`${API_BASE_URL}/user/change-password`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    }),
  },

  // ==================== NOTIFICATIONS APIs ====================
  notifications: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/notifications`),
    markAsRead: (id) => fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
    }),
    markAllAsRead: () => fetchWithAuth(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
    }),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
    }),
  },

  // ==================== SETTINGS APIs ====================
  settings: {
    get: () => fetchWithAuth(`${API_BASE_URL}/settings`),
    update: (settings) => fetchWithAuth(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    getApiKeys: () => fetchWithAuth(`${API_BASE_URL}/settings/api-keys`),
    createApiKey: (name) => fetchWithAuth(`${API_BASE_URL}/settings/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    deleteApiKey: (id) => fetchWithAuth(`${API_BASE_URL}/settings/api-keys/${id}`, {
      method: 'DELETE',
    }),
  },

  // ==================== ADMIN - DASHBOARD APIs ====================
  admin: {
    getDashboard: () => fetchWithAuth(`${API_BASE_URL}/admin/dashboard/stats`),
    getMetrics: () => fetchWithAuth(`${API_BASE_URL}/admin/metrics`),
    getUsersGraph: (days = 30) => fetchWithAuth(`${API_BASE_URL}/admin/users/graph?days=${days}`),
    getRevenueChart: (months = 12) => fetchWithAuth(`${API_BASE_URL}/admin/revenue/chart?months=${months}`),
  },

  // ==================== ADMIN - USER MANAGEMENT APIs ====================
  adminUsers: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`${API_BASE_URL}/admin/users?${params}`);
    },
    getById: (id) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`),
    create: (userData) => fetchWithAuth(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    update: (id, userData) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/delete`, {
      method: 'POST',
    }),
    suspend: (id, reason) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspend: true, reason }),
    }),
    activate: (id) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/approve`, {
      method: 'POST',
    }),
    impersonate: (id) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/impersonate`, {
      method: 'POST',
    }),
    resetPassword: (id) => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: 'Password123!' }), // Default password for reset
    }),
    getPending: () => fetchWithAuth(`${API_BASE_URL}/admin/pending-users`),
    approvePending: (id) => fetchWithAuth(`${API_BASE_URL}/admin/pending-users/${id}/approve`, {
      method: 'POST',
    }),
    rejectPending: (id, reason) => fetchWithAuth(`${API_BASE_URL}/admin/pending-users/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  },

  // ==================== ADMIN - CAMPAIGNS APIs ====================
  adminCampaigns: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/admin/campaigns`),
    suspend: (id) => fetchWithAuth(`${API_BASE_URL}/admin/campaigns/${id}/suspend`, {
      method: 'POST',
    }),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/admin/campaigns/${id}`, {
      method: 'DELETE',
    }),
  },

  // ==================== ADMIN - LINKS APIs ====================
  adminLinks: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/admin/links`),
    delete: (id) => fetchWithAuth(`${API_BASE_URL}/links/${id}`, { method: 'DELETE' }),
  },

  // ==================== ADMIN - PAYMENTS APIs ====================
  adminPayments: {
    getSubscriptions: () => fetchWithAuth(`${API_BASE_URL}/admin/subscriptions`),
    getInvoices: () => fetchWithAuth(`${API_BASE_URL}/admin/invoices`),
    getTransactions: () => fetchWithAuth(`${API_BASE_URL}/admin/transactions`),
    getPlans: () => fetchWithAuth(`${API_BASE_URL}/admin/subscription-plans`),
    createPlan: (planData) => fetchWithAuth(`${API_BASE_URL}/admin/subscription-plans`, {
      method: 'POST',
      body: JSON.stringify(planData),
    }),
    updatePlan: (id, planData) => fetchWithAuth(`${API_BASE_URL}/admin/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    }),
    getCryptoPayments: () => fetchWithAuth(`${API_BASE_URL}/admin/crypto-payments`),
    verifyCryptoPayment: (id, verified) => fetchWithAuth(`${API_BASE_URL}/admin/crypto-payments/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified }),
    }),
  },

  // ==================== ADMIN - SUPPORT TICKETS APIs ====================
  adminTickets: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`${API_BASE_URL}/admin/support-tickets?${params}`);
    },
    getById: (id) => fetchWithAuth(`${API_BASE_URL}/admin/support-tickets/${id}`),
    update: (id, data) => fetchWithAuth(`${API_BASE_URL}/admin/support-tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    reply: (id, message) => fetchWithAuth(`${API_BASE_URL}/admin/support-tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
    assign: (id, adminId) => fetchWithAuth(`${API_BASE_URL}/admin/support-tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    }),
    close: (id) => fetchWithAuth(`${API_BASE_URL}/admin/support-tickets/${id}/close`, {
      method: 'POST',
    }),
  },

  // ==================== ADMIN - AUDIT LOGS APIs ====================
  adminLogs: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`${API_BASE_URL}/admin/audit-logs?${params}`);
    },
    export: (format = 'csv') => fetchWithAuth(`${API_BASE_URL}/admin/audit-logs/export?format=${format}`),
  },

  // ==================== ADMIN - SECURITY APIs ====================
  adminSecurity: {
    getThreats: () => fetchWithAuth(`${API_BASE_URL}/admin/security/threats`),
    getThreatDetails: (id) => fetchWithAuth(`${API_BASE_URL}/admin/security/threats/${id}`),
    blockIP: (ip, reason) => fetchWithAuth(`${API_BASE_URL}/admin/security/block-ip`, {
      method: 'POST',
      body: JSON.stringify({ ip, reason }),
    }),
    unblockIP: (ip) => fetchWithAuth(`${API_BASE_URL}/admin/security/unblock-ip`, {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),
    quarantineLink: (linkId) => fetchWithAuth(`${API_BASE_URL}/admin/security/quarantine-link`, {
      method: 'POST',
      body: JSON.stringify({ linkId }),
    }),
  },

  // ==================== ADMIN - SETTINGS APIs ====================
  adminSettings: {
    get: () => fetchWithAuth(`${API_BASE_URL}/admin/settings`),
    update: (settings) => fetchWithAuth(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    getCryptoWallets: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/crypto-wallets`),
    addCryptoWallet: (walletData) => fetchWithAuth(`${API_BASE_URL}/admin/settings/crypto-wallets`, {
      method: 'POST',
      body: JSON.stringify(walletData),
    }),
    updateCryptoWallet: (id, walletData) => fetchWithAuth(`${API_BASE_URL}/admin/settings/crypto-wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(walletData),
    }),
    deleteCryptoWallet: (id) => fetchWithAuth(`${API_BASE_URL}/admin/settings/crypto-wallets/${id}`, {
      method: 'DELETE',
    }),
    getStripeSettings: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/stripe`),
    updateStripeSettings: (settings) => fetchWithAuth(`${API_BASE_URL}/admin/settings/stripe`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    testStripeConnection: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/stripe/test`, {
      method: 'POST',
    }),
    getDomains: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/domains`),
    addDomain: (domainData) => fetchWithAuth(`${API_BASE_URL}/admin/settings/domains`, {
      method: 'POST',
      body: JSON.stringify(domainData),
    }),
    updateDomain: (id, domainData) => fetchWithAuth(`${API_BASE_URL}/admin/settings/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(domainData),
    }),
    deleteDomain: (id) => fetchWithAuth(`${API_BASE_URL}/admin/settings/domains/${id}`, {
      method: 'DELETE',
    }),
    getTelegramSettings: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/telegram`),
    updateTelegramSettings: (settings) => fetchWithAuth(`${API_BASE_URL}/admin/settings/telegram`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    testTelegram: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/telegram/test`, {
      method: 'POST',
    }),
    getSMTPSettings: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/smtp`),
    updateSMTPSettings: (settings) => fetchWithAuth(`${API_BASE_URL}/admin/settings/smtp`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
    testSMTP: () => fetchWithAuth(`${API_BASE_URL}/admin/settings/smtp/test`, {
      method: 'POST',
    }),
  },

  // ==================== QUANTUM REDIRECT APIs ====================
  quantum: {
    getMetrics: () => fetchWithAuth(`${API_BASE_URL}/quantum/metrics`),
    getSecurityDashboard: () => fetchWithAuth(`${API_BASE_URL}/quantum/security-dashboard`),
    testRedirect: () => fetchWithAuth(`${API_BASE_URL}/quantum/test-redirect`),
  },

  // ==================== LINK SHORTENER APIs ====================
  shortener: {
    shorten: (url, options = {}) => fetchWithAuth(`${API_BASE_URL}/shorten`, {
      method: 'POST',
      body: JSON.stringify({ url, ...options }),
    }),
    generateQR: (shortCode) => fetchWithAuth(`${API_BASE_URL}/shorten/${shortCode}/qr`),
  },

  // ==================== DOMAINS APIs ====================
  domains: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/domains`),
    getAvailable: () => fetchWithAuth(`${API_BASE_URL}/domains/available`),
  },

  // ==================== PAYMENTS APIs ====================
  payments: {
    getPlans: () => fetchWithAuth(`${API_BASE_URL}/payments/plans`),
    createCheckoutSession: (planId) => fetchWithAuth(`${API_BASE_URL}/payments/create-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
    submitCryptoPayment: (paymentData) => fetchWithAuth(`${API_BASE_URL}/crypto-payments/submit`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
    getCryptoWallets: () => fetchWithAuth(`${API_BASE_URL}/crypto-payments/wallets`),
  },

  // ==================== SUPPORT TICKETS APIs (User) ====================
  tickets: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/support-tickets`),
    getById: (id) => fetchWithAuth(`${API_BASE_URL}/support-tickets/${id}`),
    create: (ticketData) => fetchWithAuth(`${API_BASE_URL}/support-tickets`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),
    reply: (id, message) => fetchWithAuth(`${API_BASE_URL}/support-tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
    close: (id) => fetchWithAuth(`${API_BASE_URL}/support-tickets/${id}/close`, {
      method: 'POST',
    }),
  },
};

export default api;

// Export individual modules for convenience
export const {
  auth,
  dashboard,
  links,
  analytics,
  campaigns,
  liveActivity,
  geography,
  security,
  profile,
  notifications,
  settings,
  admin,
  adminUsers,
  adminCampaigns,
  adminLinks,
  adminPayments,
  adminTickets,
  adminLogs,
  adminSecurity,
  adminSettings,
  quantum,
  shortener,
  domains,
  payments,
  tickets,
} = api;