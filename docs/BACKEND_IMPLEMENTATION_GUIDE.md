# Backend Implementation Guide

This guide provides implementation details for the Brain Link Tracker backend API.

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Prisma or pg (node-postgres)
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi or Zod
- **File Upload:** Multer
- **Email:** Nodemailer
- **Payment:** Stripe SDK
- **Caching:** Redis (optional)
- **Testing:** Jest + Supertest

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── stripe.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── analytics.js
│   │   ├── links.js
│   │   ├── campaigns.js
│   │   ├── settings.js
│   │   ├── admin.js
│   │   ├── notifications.js
│   │   └── shortener.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── analyticsController.js
│   │   ├── linksController.js
│   │   └── ...
│   ├── services/
│   │   ├── emailService.js
│   │   ├── geoipService.js
│   │   ├── stripeService.js
│   │   ├── telegramService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── encryption.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── models/
│   │   └── (if using ORM)
│   └── app.js
├── tests/
├── .env
├── package.json
└── server.js
```

## Core Implementation

### 1. Database Connection (config/database.js)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

### 2. Authentication Middleware (middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const result = await db.query(
      'SELECT id, email, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
```

### 3. Auth Controller (controllers/authController.js)

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, role, plan_type) 
       VALUES ($1, $2, $3, 'member', 'free') 
       RETURNING id, email, username, role`,
      [email, username, passwordHash]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await db.query(
      'SELECT id, email, username, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, username, role, plan_type, avatar_url, phone, 
              subscription_end_date, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, getCurrentUser };
```

### 4. Analytics Controller (controllers/analyticsController.js)

```javascript
const db = require('../config/database');

const getDashboardData = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const dateRanges = {
      '24h': '1 day',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };

    const dateRange = dateRanges[period] || '7 days';

    // Get total links
    const linksResult = await db.query(
      'SELECT COUNT(*) as total FROM tracking_links WHERE user_id = $1',
      [userId]
    );

    // Get total clicks
    const clicksResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       WHERE tl.user_id = $1 
       AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'`,
      [userId]
    );

    // Get real visitors (excluding bots)
    const visitorsResult = await db.query(
      `SELECT COUNT(DISTINCT ce.ip_address) as total 
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       WHERE tl.user_id = $1 
       AND ce.is_bot = false
       AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'`,
      [userId]
    );

    // Get captured emails
    const emailsResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM captured_data cd
       JOIN tracking_links tl ON cd.link_id = tl.id
       WHERE tl.user_id = $1 
       AND cd.captured_at >= NOW() - INTERVAL '${dateRange}'`,
      [userId]
    );

    // Get active links
    const activeLinksResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM tracking_links 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // Calculate conversion rate
    const totalClicks = parseInt(clicksResult.rows[0].total);
    const totalEmails = parseInt(emailsResult.rows[0].total);
    const conversionRate = totalClicks > 0 
      ? ((totalEmails / totalClicks) * 100).toFixed(2) 
      : 0;

    // Get device breakdown
    const deviceResult = await db.query(
      `SELECT 
         device,
         COUNT(*) as count
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       WHERE tl.user_id = $1 
       AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'
       GROUP BY device`,
      [userId]
    );

    const deviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0
    };

    let totalDeviceClicks = 0;
    deviceResult.rows.forEach(row => {
      const device = row.device?.toLowerCase() || 'desktop';
      deviceBreakdown[device] = parseInt(row.count);
      totalDeviceClicks += parseInt(row.count);
    });

    // Calculate percentages
    const deviceBreakdownPercent = {
      desktopPercent: totalDeviceClicks > 0 
        ? ((deviceBreakdown.desktop / totalDeviceClicks) * 100).toFixed(2) 
        : 0,
      mobilePercent: totalDeviceClicks > 0 
        ? ((deviceBreakdown.mobile / totalDeviceClicks) * 100).toFixed(2) 
        : 0,
      tabletPercent: totalDeviceClicks > 0 
        ? ((deviceBreakdown.tablet / totalDeviceClicks) * 100).toFixed(2) 
        : 0
    };

    // Get performance over time
    const performanceResult = await db.query(
      `SELECT 
         DATE(ce.clicked_at) as date,
         COUNT(DISTINCT ce.id) as clicks,
         COUNT(DISTINCT ce.ip_address) as visitors,
         COUNT(DISTINCT cd.id) as emails
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       LEFT JOIN captured_data cd ON tl.id = cd.link_id 
         AND DATE(cd.captured_at) = DATE(ce.clicked_at)
       WHERE tl.user_id = $1 
       AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'
       GROUP BY DATE(ce.clicked_at)
       ORDER BY DATE(ce.clicked_at)`,
      [userId]
    );

    // Get top countries
    const countriesResult = await db.query(
      `SELECT 
         country,
         country_code,
         COUNT(*) as clicks,
         COUNT(DISTINCT cd.id) as emails
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       LEFT JOIN captured_data cd ON ce.id = cd.click_event_id
       WHERE tl.user_id = $1 
       AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'
       AND ce.country IS NOT NULL
       GROUP BY country, country_code
       ORDER BY clicks DESC
       LIMIT 5`,
      [userId]
    );

    // Add flags and percentages to countries
    const countryFlags = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷'
    };

    const topCountries = countriesResult.rows.map(row => ({
      country: row.country,
      flag: countryFlags[row.country_code] || '🌍',
      clicks: parseInt(row.clicks),
      emails: parseInt(row.emails),
      percentage: totalClicks > 0 
        ? ((parseInt(row.clicks) / totalClicks) * 100).toFixed(2) 
        : 0
    }));

    // Get campaign performance
    const campaignsResult = await db.query(
      `SELECT 
         c.id,
         c.name,
         c.status,
         COUNT(DISTINCT ce.id) as clicks,
         COUNT(DISTINCT cd.id) as emails
       FROM campaigns c
       LEFT JOIN tracking_links tl ON c.id = tl.campaign_id
       LEFT JOIN click_events ce ON tl.id = ce.link_id 
         AND ce.clicked_at >= NOW() - INTERVAL '${dateRange}'
       LEFT JOIN captured_data cd ON tl.id = cd.link_id 
         AND cd.captured_at >= NOW() - INTERVAL '${dateRange}'
       WHERE c.user_id = $1
       GROUP BY c.id, c.name, c.status
       ORDER BY clicks DESC
       LIMIT 5`,
      [userId]
    );

    const campaignPerformance = campaignsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      clicks: parseInt(row.clicks),
      emails: parseInt(row.emails),
      conversion: row.clicks > 0 
        ? ((parseInt(row.emails) / parseInt(row.clicks)) * 100).toFixed(1) + '%'
        : '0%'
    }));

    // Get recent captures
    const capturesResult = await db.query(
      `SELECT 
         cd.email,
         cd.captured_at,
         c.name as campaign
       FROM captured_data cd
       JOIN tracking_links tl ON cd.link_id = tl.id
       LEFT JOIN campaigns c ON tl.campaign_id = c.id
       WHERE tl.user_id = $1
       ORDER BY cd.captured_at DESC
       LIMIT 10`,
      [userId]
    );

    const recentCaptures = capturesResult.rows.map(row => ({
      email: row.email,
      timestamp: row.captured_at,
      campaign: row.campaign || 'N/A'
    }));

    // Get all captured emails
    const allEmailsResult = await db.query(
      `SELECT 
         cd.email,
         cd.captured_at,
         c.name as campaign,
         tl.slug as link_id
       FROM captured_data cd
       JOIN tracking_links tl ON cd.link_id = tl.id
       LEFT JOIN campaigns c ON tl.campaign_id = c.id
       WHERE tl.user_id = $1
       ORDER BY cd.captured_at DESC`,
      [userId]
    );

    const allCapturedEmails = allEmailsResult.rows.map(row => ({
      email: row.email,
      timestamp: row.captured_at,
      campaign: row.campaign || 'N/A',
      link_id: row.link_id
    }));

    res.json({
      totalLinks: parseInt(linksResult.rows[0].total),
      totalClicks: totalClicks,
      realVisitors: parseInt(visitorsResult.rows[0].total),
      capturedEmails: totalEmails,
      activeLinks: parseInt(activeLinksResult.rows[0].total),
      conversionRate: parseFloat(conversionRate),
      deviceBreakdown: {
        ...deviceBreakdown,
        ...deviceBreakdownPercent
      },
      performanceOverTime: performanceResult.rows,
      topCountries,
      campaignPerformance,
      recentCaptures,
      allCapturedEmails
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDashboardData };
```

### 5. Live Activity Implementation

```javascript
const getLiveActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stats
    const statsResult = await db.query(
      `SELECT 
         COUNT(DISTINCT CASE 
           WHEN ce.clicked_at >= NOW() - INTERVAL '5 minutes' 
           THEN ce.ip_address 
         END) as active_now,
         COUNT(DISTINCT CASE 
           WHEN ce.clicked_at >= NOW() - INTERVAL '1 hour' 
           THEN ce.id 
         END) as clicks_last_hour,
         COUNT(DISTINCT CASE 
           WHEN ce.clicked_at >= NOW() - INTERVAL '1 hour' 
           THEN ce.ip_address 
         END) as unique_visitors,
         COUNT(DISTINCT ce.id) as total_clicks,
         COUNT(DISTINCT CASE WHEN ce.is_bot = false THEN ce.ip_address END) as total_real_visitors,
         COUNT(DISTINCT CASE WHEN ce.is_bot = true THEN ce.id END) as total_bot_blocks
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       WHERE tl.user_id = $1`,
      [userId]
    );

    // Get recent activities
    const activitiesResult = await db.query(
      `SELECT 
         ce.clicked_at as timestamp,
         ce.session_id,
         ce.unique_id,
         tl.slug as link_id,
         ce.ip_address,
         ce.device,
         ce.city,
         ce.region,
         ce.postal_code,
         ce.country,
         ce.status,
         ce.browser,
         ce.os,
         ce.isp,
         ce.connection_type
       FROM click_events ce
       JOIN tracking_links tl ON ce.link_id = tl.id
       WHERE tl.user_id = $1
       AND ce.clicked_at >= NOW() - INTERVAL '1 hour'
       ORDER BY ce.clicked_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      stats: statsResult.rows[0],
      activities: activitiesResult.rows
    });
  } catch (error) {
    console.error('Live activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### 6. GeoIP Service (services/geoipService.js)

```javascript
const axios = require('axios');

const getLocationData = async (ipAddress) => {
  try {
    // Using ipapi.co (free tier: 1000 requests/day)
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
    
    return {
      country: response.data.country_name,
      country_code: response.data.country_code,
      region: response.data.region,
      city: response.data.city,
      postal_code: response.data.postal,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      isp: response.data.org,
      connection_type: response.data.connection_type || 'Unknown'
    };
  } catch (error) {
    console.error('GeoIP lookup error:', error);
    return null;
  }
};

module.exports = { getLocationData };
```

### 7. Notification Service (services/notificationService.js)

```javascript
const db = require('../config/database');
const emailService = require('./emailService');

const checkSubscriptionExpiry = async () => {
  try {
    // Find users with subscriptions expiring in 7 days
    const result = await db.query(
      `SELECT id, email, subscription_end_date 
       FROM users 
       WHERE subscription_end_date IS NOT NULL
       AND subscription_end_date > CURRENT_TIMESTAMP
       AND subscription_end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
       AND NOT EXISTS (
         SELECT 1 FROM notifications 
         WHERE user_id = users.id 
         AND type = 'subscription_expiring'
         AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
       )`
    );

    for (const user of result.rows) {
      // Create notification
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [
          user.id,
          'subscription_expiring',
          'Subscription Expiring Soon',
          `Your subscription will expire on ${user.subscription_end_date.toLocaleDateString()}. Please renew to continue using premium features.`
        ]
      );

      // Send email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Subscription Expiring Soon',
        html: `
          <h2>Subscription Expiring Soon</h2>
          <p>Your subscription will expire on ${user.subscription_end_date.toLocaleDateString()}.</p>
          <p>Please renew to continue using premium features.</p>
        `
      });
    }

    console.log(`Checked subscription expiry for ${result.rows.length} users`);
  } catch (error) {
    console.error('Check subscription expiry error:', error);
  }
};

// Run daily
setInterval(checkSubscriptionExpiry, 24 * 60 * 60 * 1000);

module.exports = { checkSubscriptionExpiry };
```

## Testing

### Example Test (tests/auth.test.js)

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

## Deployment

See ENVIRONMENT_SETUP.md for detailed deployment instructions.

## Security Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Hash passwords with bcrypt (12+ rounds)
3. Implement rate limiting on all endpoints
4. Use HTTPS in production
5. Validate and sanitize all user inputs
6. Implement CORS properly
7. Use helmet.js for security headers
8. Keep dependencies updated
9. Implement proper error handling
10. Use environment variables for sensitive data

## Performance Optimization

1. Use database indexes effectively
2. Implement Redis caching for frequently accessed data
3. Use connection pooling
4. Optimize database queries
5. Implement pagination for large datasets
6. Use CDN for static assets
7. Enable gzip compression
8. Implement query result caching

## Monitoring

1. Log all errors and important events
2. Monitor API response times
3. Track database query performance
4. Set up alerts for critical issues
5. Monitor server resources (CPU, memory, disk)
6. Track user activity and usage patterns