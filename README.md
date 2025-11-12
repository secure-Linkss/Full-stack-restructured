# Brain Link Tracker - Full Stack SaaS Application

A comprehensive, production-ready link tracking and analytics platform built with Flask (Python) backend and React (JavaScript) frontend.

## 🚀 Features

### Core Features
- **Advanced Link Shortening** - Create and manage short links with custom domains
- **Real-time Analytics** - Track clicks, conversions, and user behavior
- **Campaign Management** - Organize links into campaigns with performance metrics
- **Geographic Intelligence** - Track user locations with interactive maps
- **Device & Browser Analytics** - Detailed breakdown of user devices and browsers
- **A/B Testing** - Run experiments to optimize conversion rates

### Security Features
- **Two-Factor Authentication (2FA)** - Enhanced account security with TOTP
- **Role-Based Access Control** - Main Admin, Admin, and Member roles
- **IP & Country Blocking** - Prevent access from specific IPs or countries
- **Security Threat Detection** - Monitor and respond to security threats
- **Rate Limiting** - Protect against abuse and DDoS attacks
- **HTTPS Enforcement** - Automatic redirect to secure connections

### Payment & Subscription
- **Multiple Payment Methods** - Stripe integration and crypto payments
- **Flexible Plans** - Free, Weekly, Biweekly, Monthly, Quarterly, Pro, Enterprise
- **Subscription Management** - Automated expiry checks and notifications
- **Manual Verification** - Admin approval for crypto payments

### Advanced Features
- **Telegram Integration** - Receive notifications via Telegram bot
- **API Access** - RESTful API with key-based authentication
- **QR Code Generation** - Auto-generate QR codes for links
- **Custom Domains** - Use your own domains for link shortening
- **Quantum Redirect** - Advanced redirect logic with A/B testing
- **Live Activity Monitor** - Real-time user activity tracking
- **Support Ticket System** - Built-in customer support management

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 16+** and npm/pnpm
- **PostgreSQL 12+** (Neon DB recommended)
- **Redis** (optional, for rate limiting)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/secure-Linkss/Full-stack-restructured.git
cd Full-stack-restructured
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Frontend Setup

```bash
# Install Node dependencies
pnpm install

# Build frontend
pnpm run build
```

### 4. Database Setup

```bash
# Initialize database
flask db init

# Run migrations
flask db upgrade

# Or manually run the schema
psql $DATABASE_URL < database_schema.sql
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Security (REQUIRED)
SECRET_KEY=your-secret-key-minimum-32-characters

# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database

# Short.io API (REQUIRED for link shortening)
SHORTIO_API_KEY=your-shortio-api-key
SHORTIO_DOMAIN=your-domain.short.gy
```

### Optional Environment Variables

```bash
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000

# CORS Origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Telegram Bot
TELEGRAM_BOT_TOKEN_SYSTEM=your-bot-token

# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Rate Limiting
RATELIMIT_ENABLED=True
RATELIMIT_STORAGE_URL=redis://localhost:6379
```

## 🚀 Running the Application

### Development Mode

```bash
# Start backend (Flask)
python api/index.py

# Start frontend dev server (in another terminal)
pnpm run dev
```

### Production Mode

```bash
# Build frontend
pnpm run build

# Start with Gunicorn
gunicorn api.index:app --bind 0.0.0.0:5000 --workers 4
```

### Using Docker (Coming Soon)

```bash
docker-compose up -d
```

## 📦 Deployment

### Vercel Deployment

The project is configured for Vercel deployment with the included `vercel.json`:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Manual Deployment

1. Build the frontend: `pnpm run build`
2. Set up environment variables on your hosting platform
3. Configure PostgreSQL database
4. Deploy backend with Gunicorn or similar WSGI server
5. Serve static files from `dist/` directory

## 🗄️ Database Schema

The application uses PostgreSQL with 30+ tables including:

- **users** - User accounts and authentication
- **links** - Shortened links and tracking
- **campaigns** - Marketing campaigns
- **tracking_events** - Click and conversion data
- **notifications** - User notifications
- **security_threats** - Security monitoring
- **support_tickets** - Customer support
- **subscriptions** - Payment and subscription data

See `database_schema.sql` for complete schema.

## 🔐 Default Admin Accounts

**Main Admin:**
- Username: `Brain`
- Password: `Mayflower1!!`

**Admin:**
- Username: `7thbrain`
- Password: `Mayflower1!`

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

## 📚 API Documentation

### Authentication

All API endpoints require authentication via JWT token:

```bash
# Login
POST /api/auth/login
{
  "username": "your-username",
  "password": "your-password"
}

# Response includes token
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}

# Use token in subsequent requests
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Key Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/links` - Create short link
- `GET /api/links` - List user's links
- `GET /api/analytics` - Get analytics data
- `GET /api/campaigns` - List campaigns
- `POST /api/admin/users` - Manage users (admin only)

## 🧪 Testing

```bash
# Run Python syntax check
python check_python_syntax.py

# Run frontend linting
pnpm run lint

# Test backend endpoints
python test_backend.py
```

## 📁 Project Structure

```
Full-stack-restructured/
├── api/                    # Backend API
│   ├── routes/            # Flask blueprints/endpoints
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   ├── cron/              # Scheduled tasks
│   ├── config/            # Configuration
│   └── index.py           # Main entry point
├── src/                   # Frontend
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── config/            # Frontend config
│   └── App.jsx            # Main React app
├── migrations/            # Database migrations
├── dist/                  # Built frontend (generated)
├── public/                # Static assets
├── database_schema.sql    # Complete DB schema
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🐛 Troubleshooting

### Common Issues

**Import Errors:**
- Ensure you're running from the project root directory
- Check that `PYTHONPATH` includes the project root

**Database Connection:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall rules for database port

**Frontend Build Errors:**
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear cache: `pnpm store prune`

**Rate Limiting Issues:**
- If Redis is not available, rate limiting falls back to memory
- Set `RATELIMIT_ENABLED=False` to disable

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/secure-Linkss/Full-stack-restructured/issues
- Email: admin@brainlinktracker.com

## 🎯 Roadmap

- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Advanced ML-based analytics
- [ ] Webhook integrations
- [ ] SSO/OAuth support

## ✅ Production Checklist

Before deploying to production:

- [ ] Change default admin passwords
- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting with Redis
- [ ] Configure email service (SMTP)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all critical endpoints
- [ ] Review security settings
- [ ] Set appropriate CORS origins
- [ ] Enable 2FA for admin accounts

---

**Built with ❤️ by the Brain Link Tracker Team**