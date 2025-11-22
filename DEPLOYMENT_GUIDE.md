# Brain Link Tracker - Deployment Guide
**Date:** November 22, 2025  
**Version:** 1.0.0

---

## Pre-Deployment Checklist

✅ All code changes committed to master branch  
✅ Phase 1: Frontend fixes complete  
✅ Phase 2: Backend fixes complete  
✅ Phase 3: Admin settings complete  
✅ Implementation summary documented  

---

## Deployment Steps

### Step 1: Pull Latest Changes

```bash
cd /path/to/Full-stack-restructured
git pull origin master
```

**Expected Output:**
```
From https://github.com/secure-Linkss/Full-stack-restructured
 * branch            master     -> FETCH_HEAD
Already up to date. (or showing new commits)
```

### Step 2: Verify Changes

```bash
git log --oneline -5
```

**You should see these recent commits:**
- Complete Implementation Summary
- Phase 3: Admin Settings Domain Management Routes
- Phase 2: Backend Fixes - User Model & Settings
- Phase 1: Critical Frontend Fixes

### Step 3: Install Frontend Dependencies

```bash
npm install --legacy-peer-deps
```

**Expected:** Dependencies should install without errors (warnings are okay)

### Step 4: Build Frontend

```bash
npm run build
```

**Expected:** 
- Build should complete in 2-5 minutes
- Creates `dist/` folder with built assets
- Output shows asset file sizes

**If build hangs or fails:**
```bash
# Clear cache and try again
rm -rf node_modules/.vite
npm run build
```

### Step 5: Install Backend Dependencies

```bash
# If using virtualenv
source venv/bin/activate

# Install/update requirements
pip install -r requirements.txt
```

### Step 6: Run Database Migration

**CRITICAL: This adds new user fields to the database**

```bash
python3 api/migrations/add_user_fields_migration.py
```

**Expected Output:**
```
Starting migration: Adding new user fields...
✓ Added column: phone
✓ Added column: country
✓ Added column: bio
✓ Added column: timezone
✓ Added column: language
✓ Added column: theme
✓ Added column: two_factor_enabled
✓ Added column: two_factor_secret
✓ Added column: backup_codes
✓ Added column: last_activity_at
✓ Added column: session_count

✓ Migration completed successfully!
```

**If columns already exist:**
```
- Column already exists: phone
- Column already exists: country
...
✓ Migration completed successfully!
```

### Step 7: Restart Backend Services

#### Option A: Using Systemd
```bash
sudo systemctl restart brainlinktracker
sudo systemctl status brainlinktracker
```

#### Option B: Using PM2
```bash
pm2 restart brainlinktracker
pm2 logs brainlinktracker
```

#### Option C: Using Gunicorn Directly
```bash
# Stop existing process
pkill gunicorn

# Start new process
gunicorn -w 4 -b 0.0.0.0:5000 api.index:app --daemon
```

### Step 8: Verify Deployment

#### 8.1 Check Application is Running
```bash
curl http://localhost:5000/api/user/profile
```

**Expected:** Should return authentication error (means API is responding)

#### 8.2 Check Frontend Assets
```bash
ls -lh dist/assets/
```

**Expected:** Should see multiple JS and CSS files

#### 8.3 Access Application
Open browser and navigate to your domain. Test these pages:

1. **Dashboard** - `/`
   - Should load without "Failed to Load" errors
   - Metrics should display with numbers
   - Charts should render

2. **Admin Users** - `/admin/users`
   - Should show 11 columns in table
   - "All Users" and "Pending Approvals" tabs visible
   - "Add User" button should open modal

3. **Admin Settings > Domains Tab** - `/admin/settings`
   - Should see 6 tabs now (added Domains)
   - Domains tab should display domain table
   - "Add Domain" button should work

4. **User Settings > Notifications** - `/settings`
   - Should see Telegram integration section
   - Toggle switches should work
   - Fields should save properly

---

## Post-Deployment Verification

### Test New Features

#### 1. Create User Workflow
```
1. Go to Admin Users
2. Click "Add User"
3. Fill form and submit
4. Verify user appears in table
```

#### 2. Pending Users Approval
```
1. Go to Admin Users > Pending Approvals tab
2. Should see pending users (if any)
3. Test Approve/Reject buttons
```

#### 3. Domain Management
```
1. Go to Admin Settings > Domains tab
2. Click "Add Domain"
3. Enter domain name and type
4. Save and verify it appears in table
```

#### 4. Telegram Notifications
```
1. Go to User Settings
2. Enable Telegram notifications
3. Enter bot token and chat ID
4. Click "Test Notification" button
```

---

## Rollback Procedure

If issues occur during deployment:

### Step 1: Revert Git Changes
```bash
git log --oneline -10  # Find previous stable commit
git reset --hard <commit-hash>
```

### Step 2: Rebuild Frontend
```bash
npm run build
```

### Step 3: Restart Backend
```bash
sudo systemctl restart brainlinktracker
# or
pm2 restart brainlinktracker
```

### Step 4: Database Rollback (if needed)
**Note:** Migration adds columns only, doesn't modify existing data. 
If rollback needed, manually remove columns (use with caution):

```sql
-- SQLite
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users DROP COLUMN country;
-- ... etc for other columns

-- PostgreSQL
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS country;
-- ... etc for other columns
```

---

## Troubleshooting

### Issue: "Failed to Load" on Dashboard

**Solution:**
1. Check browser console for errors
2. Verify API is running: `curl http://localhost:5000/api/analytics/dashboard?period=7d`
3. Check backend logs for errors
4. Verify database connection

### Issue: Build Hangs During `npm run build`

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear node_modules and reinstall
rm -rf node_modules
npm install --legacy-peer-deps

# Try build again
npm run build
```

### Issue: Missing Database Columns

**Solution:**
```bash
# Re-run migration
python3 api/migrations/add_user_fields_migration.py

# Check if columns exist
sqlite3 src/database/app.db ".schema users"
# or for PostgreSQL
psql $DATABASE_URL -c "\d users"
```

### Issue: 404 on New API Endpoints

**Solution:**
1. Verify blueprint is registered in `api/index.py`
2. Check route definitions in blueprint files
3. Restart backend service
4. Check logs: `pm2 logs` or `journalctl -u brainlinktracker`

### Issue: Telegram Notifications Not Working

**Note:** Telegram API integration is not fully implemented yet. The UI is ready, but actual message sending needs implementation. This is documented in IMPLEMENTATION_SUMMARY.md as a future improvement.

---

## Environment Variables

Ensure these environment variables are set:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # or SQLite path
SECRET_KEY=your-secret-key-here

# Optional (for future Telegram integration)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Optional (for email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

---

## Performance Monitoring

After deployment, monitor these metrics:

1. **Page Load Time** - Should be < 3 seconds
2. **API Response Time** - Should be < 500ms
3. **Database Query Time** - Should be < 100ms
4. **Memory Usage** - Monitor for leaks
5. **Error Logs** - Check for recurring errors

---

## Support & Issues

If you encounter issues not covered in this guide:

1. Check `IMPLEMENTATION_SUMMARY.md` for details on changes
2. Review commit messages: `git log --oneline -20`
3. Check application logs
4. Verify all dependencies are installed
5. Ensure database migration ran successfully

---

## Next Steps (Future Improvements)

After successful deployment, consider implementing:

1. **Telegram API Integration** - Complete the notification sending logic
2. **Domain Verification** - Implement DNS verification workflow
3. **2FA Implementation** - Enable two-factor authentication
4. **Email Integration** - Set up SMTP for email notifications
5. **Performance Optimizations** - Add database indexes, implement caching

See IMPLEMENTATION_SUMMARY.md section "Known Issues & Future Improvements" for details.

---

**Last Updated:** November 22, 2025  
**Status:** Ready for Deployment  
**Tested:** Syntax validation passed, Git push successful
