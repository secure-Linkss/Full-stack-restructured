# API Routes Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Authentication
Most endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## Authentication Routes

### POST /api/auth/register
Register a new user account
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    }
  }
  ```

### POST /api/auth/login
Login to existing account
- **Body:**
  ```json
  {
    "username": "username",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "member"
    }
  }
  ```

### GET /api/auth/me
Get current authenticated user
- **Auth:** Required
- **Response:**
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "member",
      "plan_type": "free",
      "avatar_url": "https://..."
    }
  }
  ```

---

## Analytics Routes

### GET /api/analytics/dashboard
Get dashboard overview data
- **Auth:** Required
- **Query Params:** `period` (24h, 7d, 30d, 90d)
- **Response:**
  ```json
  {
    "totalLinks": 150,
    "totalClicks": 5420,
    "realVisitors": 3200,
    "capturedEmails": 450,
    "activeLinks": 120,
    "conversionRate": 14.06,
    "deviceBreakdown": {
      "desktop": 2500,
      "mobile": 2100,
      "tablet": 820,
      "desktopPercent": 46.13,
      "mobilePercent": 38.75,
      "tabletPercent": 15.12
    },
    "performanceOverTime": [
      {
        "date": "2024-01-15",
        "clicks": 450,
        "visitors": 320,
        "emails": 45
      }
    ],
    "topCountries": [
      {
        "country": "United States",
        "flag": "🇺🇸",
        "clicks": 2100,
        "emails": 180,
        "percentage": 38.75,
        "coordinates": [37.0902, -95.7129]
      }
    ],
    "campaignPerformance": [
      {
        "id": "camp_123",
        "name": "Summer Sale 2024",
        "status": "active",
        "clicks": 850,
        "emails": 120,
        "conversion": "14.1%"
      }
    ],
    "recentCaptures": [
      {
        "email": "user@example.com",
        "timestamp": "2024-01-15 14:30:25",
        "campaign": "Summer Sale"
      }
    ],
    "allCapturedEmails": [
      {
        "email": "user@example.com",
        "timestamp": "2024-01-15 14:30:25",
        "campaign": "Summer Sale",
        "link_id": "abc123"
      }
    ]
  }
  ```

### GET /api/analytics/live-activity
Get real-time activity data
- **Auth:** Required
- **Response:**
  ```json
  {
    "stats": {
      "active_now": 12,
      "clicks_last_hour": 45,
      "unique_visitors": 32,
      "total_clicks": 5420,
      "total_real_visitors": 3200,
      "total_bot_blocks": 142
    },
    "activities": [
      {
        "timestamp": "2024-01-15 14:30:25",
        "session_id": "00:02:45",
        "unique_id": "uid_abc123_001",
        "link_id": "abc123",
        "ip_address": "192.168.1.100",
        "device": "Desktop",
        "city": "New York",
        "region": "NY",
        "postal_code": "10001",
        "country": "United States",
        "status": "On Page",
        "browser": "Chrome 120.0.0.0",
        "os": "Windows 10",
        "isp": "Comcast Cable",
        "connection_type": "Broadband"
      }
    ]
  }
  ```

### GET /api/analytics/geography
Get geographic analytics data
- **Auth:** Required
- **Query Params:** `period` (24h, 7d, 30d, 90d)
- **Response:**
  ```json
  {
    "countries": [
      {
        "name": "United States",
        "flag": "🇺🇸",
        "clicks": 2100,
        "emails": 180,
        "percentage": 38.75,
        "coordinates": [37.0902, -95.7129]
      }
    ],
    "cities": [
      {
        "name": "New York",
        "country": "United States",
        "postal_code": "10001",
        "clicks": 850
      }
    ],
    "regions": [
      {
        "name": "New York",
        "country": "United States",
        "clicks": 1200
      }
    ],
    "mapPoints": [
      {
        "lat": 40.7128,
        "lng": -74.0060,
        "city": "New York",
        "country": "United States",
        "clicks": 850,
        "visitors": 620,
        "emails": 95
      }
    ]
  }
  ```

### GET /api/analytics/summary
Get analytics summary
- **Auth:** Required
- **Response:**
  ```json
  {
    "totalClicks": 5420,
    "realVisitors": 3200,
    "botsBlocked": 142
  }
  ```

### GET /api/analytics/detailed
Get detailed analytics with charts
- **Auth:** Required
- **Query Params:** `period` (24h, 7d, 30d, 90d)
- **Response:**
  ```json
  {
    "overview": {
      "total_clicks": 5420,
      "unique_visitors": 3200,
      "conversion_rate": 14.06,
      "avg_session_duration": 145
    },
    "timeline": [...],
    "devices": [...],
    "browsers": [...],
    "referrers": [...]
  }
  ```

---

## Links Routes

### GET /api/links
Get all tracking links for current user
- **Auth:** Required
- **Response:**
  ```json
  {
    "links": [
      {
        "id": "uuid",
        "campaign_name": "Summer Sale",
        "target_url": "https://example.com/product",
        "preview_url": "https://preview.example.com",
        "tracking_url": "https://track.example.com/abc123",
        "pixel_url": "https://track.example.com/pixel/abc123",
        "status": "active",
        "total_clicks": 450,
        "real_visitors": 320,
        "blocked_attempts": 12,
        "created_at": "2024-01-15",
        "bot_blocking_enabled": true,
        "rate_limiting_enabled": false,
        "capture_email": true,
        "capture_password": false
      }
    ]
  }
  ```

### POST /api/links
Create new tracking link
- **Auth:** Required
- **Body:**
  ```json
  {
    "target_url": "https://example.com/product",
    "preview_url": "https://preview.example.com",
    "campaign_name": "Summer Sale",
    "domain": "track.example.com",
    "capture_email": true,
    "capture_password": false,
    "bot_blocking_enabled": true,
    "rate_limiting_enabled": false,
    "dynamic_signature_enabled": false,
    "mx_verification_enabled": false,
    "geo_targeting_enabled": true,
    "geo_targeting_mode": "allow",
    "allowed_countries": ["US", "GB", "CA"],
    "blocked_countries": [],
    "device_filtering_enabled": false,
    "allowed_devices": [],
    "browser_filtering_enabled": false,
    "allowed_browsers": [],
    "block_repeat_clicks": false,
    "redirect_delay": 0,
    "expiration_period": "never"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Link created successfully",
    "link": {
      "id": "uuid",
      "tracking_url": "https://track.example.com/abc123",
      "pixel_url": "https://track.example.com/pixel/abc123"
    }
  }
  ```

### DELETE /api/links/:id
Delete a tracking link
- **Auth:** Required
- **Response:**
  ```json
  {
    "message": "Link deleted successfully"
  }
  ```

### POST /api/links/regenerate/:id
Regenerate tracking link
- **Auth:** Required
- **Response:**
  ```json
  {
    "message": "Link regenerated successfully",
    "link": {
      "tracking_url": "https://track.example.com/xyz789",
      "pixel_url": "https://track.example.com/pixel/xyz789"
    }
  }
  ```

---

## Campaigns Routes

### GET /api/campaigns
Get all campaigns
- **Auth:** Required
- **Response:**
  ```json
  {
    "campaigns": [
      {
        "id": "uuid",
        "name": "Summer Sale 2024",
        "description": "Summer promotional campaign",
        "status": "active",
        "target_url": "https://example.com",
        "budget": 5000,
        "total_clicks": 850,
        "unique_visitors": 620,
        "conversion_rate": 14.1,
        "link_count": 5,
        "created_at": "2024-01-15"
      }
    ]
  }
  ```

### POST /api/campaigns
Create new campaign
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "Summer Sale 2024",
    "description": "Summer promotional campaign",
    "status": "active",
    "target_url": "https://example.com",
    "budget": 5000
  }
  ```

### DELETE /api/campaigns/:id
Delete campaign
- **Auth:** Required
- **Response:**
  ```json
  {
    "message": "Campaign deleted successfully"
  }
  ```

---

## Settings Routes

### POST /api/settings/account
Update account information
- **Auth:** Required
- **Body:**
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com",
    "phone": "+1234567890"
  }
  ```

### POST /api/settings/password
Change password
- **Auth:** Required
- **Body:**
  ```json
  {
    "current_password": "oldpass123",
    "new_password": "newpass456"
  }
  ```

### POST /api/settings/avatar
Upload avatar
- **Auth:** Required
- **Body:** FormData with 'avatar' file
- **Response:**
  ```json
  {
    "message": "Avatar uploaded successfully",
    "avatar_url": "https://..."
  }
  ```

### POST /api/settings/2fa/enable
Enable 2FA
- **Auth:** Required
- **Response:**
  ```json
  {
    "qr_code": "data:image/png;base64,...",
    "secret": "SECRET_KEY"
  }
  ```

### POST /api/settings/2fa/verify
Verify 2FA code
- **Auth:** Required
- **Body:**
  ```json
  {
    "code": "123456"
  }
  ```

### GET /api/settings/sessions
Get active sessions
- **Auth:** Required
- **Response:**
  ```json
  {
    "sessions": [
      {
        "id": "uuid",
        "device": "Chrome on Windows",
        "ip_address": "192.168.1.100",
        "location": "New York, US",
        "last_active": "2024-01-15 14:30:25",
        "is_current": true
      }
    ]
  }
  ```

### DELETE /api/settings/sessions/:id
Revoke session
- **Auth:** Required

### GET /api/settings/api-keys
Get API keys
- **Auth:** Required
- **Response:**
  ```json
  {
    "keys": [
      {
        "id": "uuid",
        "name": "Production Key",
        "key": "sk_live_...",
        "created_at": "2024-01-15",
        "last_used": "2024-01-15 14:30:25",
        "usage_count": 1250
      }
    ]
  }
  ```

### POST /api/settings/api-keys
Generate new API key
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "Production Key"
  }
  ```

### DELETE /api/settings/api-keys/:id
Delete API key
- **Auth:** Required

---

## Admin Routes

### GET /api/admin/users
Get all users (Admin only)
- **Auth:** Required (Admin/Main Admin)
- **Response:**
  ```json
  {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "username": "username",
        "role": "member",
        "plan_type": "free",
        "is_active": true,
        "created_at": "2024-01-15"
      }
    ]
  }
  ```

### POST /api/admin/users
Create new user (Admin only)
- **Auth:** Required (Admin/Main Admin)
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "role": "member",
    "plan_type": "free"
  }
  ```

### PUT /api/admin/users/:id/role
Update user role (Admin only)
- **Auth:** Required (Admin/Main Admin)
- **Body:**
  ```json
  {
    "role": "admin"
  }
  ```

### DELETE /api/admin/users/:id
Delete user (Admin only)
- **Auth:** Required (Admin/Main Admin)

### GET /api/admin/domains
Get all domains
- **Auth:** Required (Admin/Main Admin)
- **Response:**
  ```json
  {
    "domains": [
      {
        "id": "uuid",
        "domain": "track.example.com",
        "is_active": true,
        "is_default": false,
        "created_at": "2024-01-15"
      }
    ]
  }
  ```

### POST /api/admin/domains
Add new domain
- **Auth:** Required (Admin/Main Admin)
- **Body:**
  ```json
  {
    "domain": "track.example.com",
    "is_active": true,
    "is_default": false
  }
  ```

### PUT /api/admin/domains/:id
Update domain
- **Auth:** Required (Admin/Main Admin)
- **Body:**
  ```json
  {
    "is_active": true,
    "is_default": false
  }
  ```

### DELETE /api/admin/domains/:id
Delete domain
- **Auth:** Required (Admin/Main Admin)

### GET /api/admin/wallets
Get crypto wallets
- **Auth:** Required (Admin/Main Admin)
- **Response:**
  ```json
  {
    "wallets": [
      {
        "id": "uuid",
        "wallet_type": "BTC",
        "wallet_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "is_active": true,
        "created_at": "2024-01-15"
      }
    ]
  }
  ```

### POST /api/admin/wallets
Add crypto wallet
- **Auth:** Required (Admin/Main Admin)
- **Body:**
  ```json
  {
    "wallet_type": "BTC",
    "wallet_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "is_active": true
  }
  ```

### DELETE /api/admin/wallets/:id
Delete wallet
- **Auth:** Required (Admin/Main Admin)

### GET /api/admin/system-config
Get system configuration
- **Auth:** Required (Main Admin)
- **Response:**
  ```json
  {
    "telegram_enabled": true,
    "telegram_bot_token": "...",
    "telegram_chat_id": "...",
    "stripe_enabled": true,
    "stripe_publishable_key": "pk_...",
    "smtp_enabled": true,
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "maintenance_mode": false,
    "enable_registrations": true,
    "max_links_per_user": 100,
    "company_name": "Brain Link Tracker"
  }
  ```

### POST /api/admin/system-config
Update system configuration
- **Auth:** Required (Main Admin)
- **Body:** Same as GET response

### POST /api/admin/telegram/test
Test Telegram connection
- **Auth:** Required (Main Admin)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Test message sent successfully"
  }
  ```

---

## Notifications Routes

### GET /api/notifications
Get user notifications
- **Auth:** Required
- **Response:**
  ```json
  {
    "notifications": [
      {
        "id": "uuid",
        "type": "subscription_expiring",
        "title": "Subscription Expiring Soon",
        "message": "Your subscription will expire in 7 days",
        "is_read": false,
        "created_at": "2024-01-15 14:30:25"
      }
    ]
  }
  ```

### PUT /api/notifications/:id/read
Mark notification as read
- **Auth:** Required

### DELETE /api/notifications/:id
Delete notification
- **Auth:** Required

### GET /api/notifications/tickets
Get support tickets
- **Auth:** Required
- **Response:**
  ```json
  {
    "tickets": [
      {
        "id": "uuid",
        "subject": "Need help with tracking",
        "status": "open",
        "priority": "medium",
        "created_at": "2024-01-15",
        "messages": [
          {
            "id": "uuid",
            "sender": "user",
            "message": "I need help...",
            "created_at": "2024-01-15 14:30:25"
          }
        ]
      }
    ]
  }
  ```

### POST /api/notifications/tickets
Create support ticket
- **Auth:** Required
- **Body:**
  ```json
  {
    "subject": "Need help",
    "message": "I need help with...",
    "priority": "medium"
  }
  ```

### POST /api/notifications/tickets/:id/messages
Add message to ticket
- **Auth:** Required
- **Body:**
  ```json
  {
    "message": "Additional information..."
  }
  ```

---

## Security Routes

### GET /api/security/overview
Get security overview
- **Auth:** Required
- **Response:**
  ```json
  {
    "security_score": 85,
    "threats_blocked": 142,
    "suspicious_activities": 5,
    "recent_threats": [...],
    "security_events": [...]
  }
  ```

---

## Link Shortener Routes

### GET /api/shortener/links
Get all short links
- **Auth:** Required
- **Response:**
  ```json
  {
    "links": [
      {
        "id": "uuid",
        "slug": "abc123",
        "original_url": "https://example.com/very/long/url",
        "short_url": "https://short.link/abc123",
        "clicks": 450,
        "is_active": true,
        "created_at": "2024-01-15"
      }
    ]
  }
  ```

### POST /api/shortener/create
Create short link
- **Auth:** Required
- **Body:**
  ```json
  {
    "url": "https://example.com/very/long/url",
    "custom_slug": "my-link"
  }
  ```

### DELETE /api/shortener/links/:id
Delete short link
- **Auth:** Required

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```