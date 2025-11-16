# Environment Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Backend Configuration

```bash
# Application
NODE_ENV=production
PORT=5000
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/brain_link_tracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=brain_link_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=30d

# Session
SESSION_SECRET=your-session-secret-change-this

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=Brain Link Tracker
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Stripe Payment
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Crypto Wallets
BTC_WALLET_ADDRESS=your-btc-wallet-address
ETH_WALLET_ADDRESS=your-eth-wallet-address
USDT_TRC20_WALLET_ADDRESS=your-usdt-trc20-address
USDT_ERC20_WALLET_ADDRESS=your-usdt-erc20-address
BNB_WALLET_ADDRESS=your-bnb-wallet-address

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
TELEGRAM_ENABLED=false

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# GeoIP Service
GEOIP_API_KEY=your-geoip-api-key
GEOIP_SERVICE=ipapi

# Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000

# 2FA
TWO_FACTOR_APP_NAME=Brain Link Tracker

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change-this-secure-password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### Frontend Configuration

Create `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Analytics (Optional)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry (Optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags
VITE_ENABLE_REGISTRATIONS=true
VITE_MAINTENANCE_MODE=false
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Full-stack-restructured
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   pnpm install

   # Backend (if separate)
   cd backend
   npm install
   ```

3. **Setup Database**
   ```bash
   # Create database
   createdb brain_link_tracker

   # Run migrations
   psql -U your_user -d brain_link_tracker -f docs/DATABASE_SCHEMA.sql
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development servers**
   ```bash
   # Frontend
   pnpm run dev

   # Backend
   cd backend
   npm run dev
   ```

## Production Deployment

### Option 1: Docker Deployment

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

### Option 2: Manual Deployment

1. **Build frontend**
   ```bash
   pnpm run build
   ```

2. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           root /var/www/brain-link-tracker/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Setup SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Start backend with PM2**
   ```bash
   pm2 start backend/server.js --name brain-link-tracker
   pm2 save
   pm2 startup
   ```

## Database Migrations

### Creating a new migration
```bash
# Example: Add new column
psql -U your_user -d brain_link_tracker << EOF
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
EOF
```

### Backup database
```bash
pg_dump -U your_user brain_link_tracker > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
psql -U your_user brain_link_tracker < backup_20240115.sql
```

## Monitoring and Logging

### Setup Logging
```bash
# Create logs directory
mkdir -p logs

# Setup log rotation
sudo nano /etc/logrotate.d/brain-link-tracker
```

Add:
```
/var/www/brain-link-tracker/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Health Check Endpoints

- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com/health`
- Database: Check via backend health endpoint

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable rate limiting
- [ ] Setup fail2ban
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] CSP headers configured

## Performance Optimization

### Frontend
- Enable gzip compression
- Configure CDN (CloudFlare)
- Optimize images
- Enable browser caching

### Backend
- Enable Redis caching
- Database query optimization
- Connection pooling
- Load balancing (if needed)

### Database
```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_performance_1 ON click_events(link_id, clicked_at DESC);
CREATE INDEX CONCURRENTLY idx_performance_2 ON captured_data(link_id, captured_at DESC);
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL in .env
   - Verify PostgreSQL is running
   - Check firewall rules

2. **CORS errors**
   - Verify CORS_ORIGIN in backend .env
   - Check Nginx proxy headers

3. **Email not sending**
   - Verify SMTP credentials
   - Check firewall allows SMTP port
   - Enable "Less secure apps" for Gmail

4. **High memory usage**
   - Check for memory leaks
   - Optimize database queries
   - Enable Redis caching

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor error logs
   - Check system resources
   - Review security alerts

2. **Weekly**
   - Database backup verification
   - Performance metrics review
   - Security updates

3. **Monthly**
   - Database optimization
   - Log cleanup
   - Dependency updates

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
pg_dump -U your_user brain_link_tracker | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/brain-link-tracker/uploads

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Support

For issues and questions:
- Documentation: https://docs.yourdomain.com
- Email: support@yourdomain.com
- GitHub Issues: https://github.com/your-repo/issues