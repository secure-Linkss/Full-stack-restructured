// Full-stack-restructured/src/services/mockApi.js

/**
 * Mock API Service for Frontend Development
 * Provides structured, realistic-looking data for all required dashboard and admin panel endpoints.
 * This allows for a data-driven component development process before the backend is fully integrated.
 */

import { faker } from '@faker-js/faker';

// --- Utility Functions ---

const generateRandomData = (count, factory) => {
  return Array.from({ length: count }, (_, index) => factory(index));
};

const generateDateRange = (days) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push(date.toISOString().split('T')[0]);
  }
  return data;
};

// --- Mock Data Factories ---

const createMockLink = (index) => ({
  id: faker.string.uuid(),
  targetUrl: faker.internet.url(),
  trackingUrl: `https://brain-link-tracker.vercel.app/t/${faker.string.alphanumeric(8)}?id={id}`,
  pixelUrl: `https://brain-link-tracker.vercel.app/p/${faker.string.alphanumeric(8)}?email={email}&id={id}`,
  emailCode: `<img src="https://brain-link-tracker.vercel.app/p/${faker.string.alphanumeric(8)}?email={email}&id={id}" width="1" height="1" style="display:none;" />`,
  campaignName: faker.commerce.productName(),
  status: faker.helpers.arrayElement(['active', 'paused', 'expired']),
  totalClicks: faker.number.int({ min: 100, max: 5000 }),
  realVisitors: faker.number.int({ min: 50, max: 2500 }),
  botsBlocked: faker.number.int({ min: 0, max: 500 }),
  createdAt: faker.date.past().toISOString(),
  lastClicked: faker.date.recent().toISOString(),
  securityFeatures: {
    botBlocking: faker.datatype.boolean(),
    rateLimiting: faker.datatype.boolean(),
    dynamicSignature: faker.datatype.boolean(),
    mxVerification: faker.datatype.boolean(),
    geoTargeting: faker.datatype.boolean(),
  },
  captureOptions: {
    captureEmail: faker.datatype.boolean(),
    capturePassword: faker.datatype.boolean(),
  },
});

const createMockUser = (index) => ({
  id: faker.string.uuid(),
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['user', 'admin', 'main_admin']),
  status: faker.helpers.arrayElement(['active', 'suspended', 'pending_approval', 'expired_sub', 'fraud_flagged']),
  subscription: faker.helpers.arrayElement(['Free', 'Basic', 'Pro', 'Enterprise']),
  traffic: faker.number.int({ min: 1000, max: 1000000 }),
  createdAt: faker.date.past().toISOString(),
  lastLogin: faker.date.recent().toISOString(),
});

const createMockTicket = (index) => ({
  id: faker.string.uuid().substring(0, 8).toUpperCase(),
  subject: faker.lorem.sentence(5),
  category: faker.helpers.arrayElement(['Billing', 'Technical', 'Feature Request', 'Security']),
  status: faker.helpers.arrayElement(['open', 'pending', 'resolved', 'closed']),
  priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
  user: faker.person.fullName(),
  slaTimer: faker.date.future().toISOString(),
  createdAt: faker.date.past().toISOString(),
});

const createMockLog = (index) => ({
  id: faker.string.uuid(),
  timestamp: faker.date.recent().toISOString(),
  eventType: faker.helpers.arrayElement(['Login Success', 'Failed Login', 'API Misuse', 'Admin Action', 'High-Risk Activity']),
  user: faker.person.fullName(),
  ipAddress: faker.internet.ip(),
  device: faker.helpers.arrayElement(['Chrome on Windows', 'Safari on iOS', 'Firefox on Linux']),
  details: faker.lorem.sentence(10),
});

// --- Mock API Endpoints ---

const mockApi = {
  // --- User Dashboard Endpoints ---

  getDashboardMetrics: () => ({
    totalLinks: faker.number.int({ min: 50, max: 500 }),
    totalClicks: faker.number.int({ min: 10000, max: 500000 }),
    realVisitors: faker.number.int({ min: 5000, max: 250000 }),
    capturedEmails: faker.number.int({ min: 100, max: 5000 }),
    activeLinks: faker.number.int({ min: 40, max: 450 }),
    conversionRate: faker.number.float({ min: 0.01, max: 0.15, precision: 0.01 }),
    countries: faker.number.int({ min: 5, max: 50 }),
  }),

  getPerformanceOverTime: (days = 30) => {
    const dates = generateDateRange(days);
    return dates.map(date => ({
      date,
      clicks: faker.number.int({ min: 500, max: 2000 }),
      visitors: faker.number.int({ min: 200, max: 1000 }),
      emailCaptures: faker.number.int({ min: 10, max: 100 }),
    }));
  },

  getDeviceBreakdown: () => [
    { name: 'Desktop', value: faker.number.int({ min: 3000, max: 10000 }), percentage: faker.number.float({ min: 0.4, max: 0.6, precision: 0.01 }) },
    { name: 'Mobile', value: faker.number.int({ min: 2000, max: 8000 }), percentage: faker.number.float({ min: 0.3, max: 0.5, precision: 0.01 }) },
    { name: 'Tablet', value: faker.number.int({ min: 500, max: 2000 }), percentage: faker.number.float({ min: 0.05, max: 0.15, precision: 0.01 }) },
  ],

  getTopCountries: () => generateRandomData(5, () => ({
    country: faker.location.country(),
    clicks: faker.number.int({ min: 500, max: 5000 }),
    emails: faker.number.int({ min: 10, max: 500 }),
    percentage: faker.number.float({ min: 0.1, max: 0.4, precision: 0.01 }),
  })),

  getCampaignPerformance: () => generateRandomData(3, () => ({
    id: faker.string.alphanumeric(8).toUpperCase(),
    name: faker.commerce.productName(),
    status: faker.helpers.arrayElement(['active', 'paused']),
    clicks: faker.number.int({ min: 100, max: 1000 }),
    conversion: faker.number.float({ min: 0.0, max: 0.1, precision: 0.01 }),
    emails: faker.number.int({ min: 0, max: 50 }),
  })),

  getRecentCaptures: () => generateRandomData(5, () => ({
    email: faker.internet.email(),
    linkName: faker.commerce.productName(),
    timestamp: faker.date.recent().toISOString(),
  })),

  getTrackingLinks: (filters) => {
    let links = generateRandomData(50, createMockLink);
    // Apply filters if needed
    return links;
  },

  // --- Admin Panel Endpoints ---

  getAdminDashboardMetrics: () => ({
    totalUsers: faker.number.int({ min: 1000, max: 50000 }),
    activeUsers: faker.number.int({ min: 800, max: 45000 }),
    suspendedUsers: faker.number.int({ min: 10, max: 500 }),
    monthlyRevenue: faker.number.int({ min: 10000, max: 500000 }),
    dailyApiUsage: faker.number.int({ min: 50000, max: 1000000 }),
  }),

  getTotalUsersGraph: (days = 30) => {
    const dates = generateDateRange(days);
    return dates.map(date => ({
      date,
      newUsers: faker.number.int({ min: 5, max: 50 }),
      deletedUsers: faker.number.int({ min: 0, max: 5 }),
    }));
  },

  getSubscriptionRevenueChart: (months = 12) => {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: faker.number.int({ min: 5000, max: 50000 }),
      });
    }
    return data;
  },

  getUserManagementTables: () => ({
    allUsers: generateRandomData(100, createMockUser),
    pendingApproval: generateRandomData(5, createMockUser).map(u => ({ ...u, status: 'pending_approval' })),
    suspendedUsers: generateRandomData(10, createMockUser).map(u => ({ ...u, status: 'suspended' })),
    expiredSubscriptions: generateRandomData(15, createMockUser).map(u => ({ ...u, status: 'expired_sub' })),
    highTrafficUsers: generateRandomData(5, createMockUser).sort((a, b) => b.traffic - a.traffic),
    fraudFlaggedAccounts: generateRandomData(3, createMockUser).map(u => ({ ...u, status: 'fraud_flagged' })),
    recentSignups: generateRandomData(10, createMockUser).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    recentlyDeleted: generateRandomData(5, createMockUser),
  }),

  getSupportTickets: (filters) => {
    let tickets = generateRandomData(30, createMockTicket);
    // Apply filters if needed
    return tickets;
  },

  getAuditLogs: (filters) => {
    let logs = generateRandomData(100, createMockLog);
    // Apply filters if needed
    return logs;
  },

  // --- Settings Endpoints ---

  getWalletManagement: () => [
    { type: 'BTC', address: faker.finance.bitcoinAddress(), status: 'Active' },
    { type: 'TRC20', address: faker.finance.ethereumAddress(), status: 'Active' },
    { type: 'USDT', address: faker.finance.ethereumAddress(), status: 'Active' },
    { type: 'ETH', address: faker.finance.ethereumAddress(), status: 'Active' },
  ],

  getDomainManagement: () => [
    { domain: 'track.brainlink.com', status: 'Active', dnsHealth: 'Healthy', type: 'tracking only' },
    { domain: 'link.brainlink.com', status: 'Active', dnsHealth: 'Healthy', type: 'redirect only' },
    { domain: 'test.brainlink.com', status: 'Inactive', dnsHealth: 'Unhealthy', type: 'tracking only' },
  ],

  // --- General Endpoints ---

  getUserProfile: () => ({
    fullName: 'Admin User',
    email: 'admin@brainlinktracker.com',
    avatarUrl: faker.image.avatar(),
    theme: 'dark',
    phoneNumber: faker.phone.number(),
    role: 'main_admin',
    subscriptionTier: 'Enterprise',
    renewalDate: faker.date.future().toISOString(),
  }),

  getLoginHistory: () => generateRandomData(10, () => ({
    ip: faker.internet.ip(),
    device: faker.helpers.arrayElement(['Chrome on Windows', 'Safari on iOS', 'Firefox on Linux']),
    time: faker.date.recent().toISOString(),
    result: faker.helpers.arrayElement(['Success', 'Failure']),
  })),

  getActiveSessions: () => generateRandomData(3, () => ({
    id: faker.string.uuid(),
    ip: faker.internet.ip(),
    device: faker.helpers.arrayElement(['Chrome on Windows', 'Safari on iOS', 'Firefox on Linux']),
    lastActive: faker.date.recent().toISOString(),
    location: faker.location.city(),
  })),

  getApiUsageLogs: () => generateRandomData(10, () => ({
    timestamp: faker.date.recent().toISOString(),
    endpoint: faker.helpers.arrayElement(['/api/links', '/api/analytics', '/api/users']),
    status: faker.helpers.arrayElement([200, 400, 500]),
    latency: faker.number.int({ min: 50, max: 500 }),
  })),
};

// Export a function that simulates an API call
export const fetchMockData = (endpoint, params = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockApi[endpoint]) {
        resolve(mockApi[endpoint](params));
      } else {
        reject(new Error(`Mock API endpoint not found: ${endpoint}`));
      }
    }, faker.number.int({ min: 300, max: 1000 })); // Simulate network latency
  });
};
