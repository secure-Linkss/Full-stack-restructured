# Brain Link Tracker - Vercel Deployment Guide

## ✅ Pre-Deployment Checklist Completed

### 1. ✅ Frontend Rebuilt
- Old dist folder deleted
- New frontend built with latest payment UI
- All components included:
  - Payment transaction hash submission form
  - Plan selection logic and UI
  - Crypto payment flow components
  - Updated pricing section

### 2. ✅ Database Connection Verified
- PostgreSQL (Neon) connection: **WORKING**
- Database URL: Corrected and tested
- Tables found: 29 tables
- PostgreSQL version: 17.5

### 3. ✅ Environment Configuration
- `.env` file updated with all credentials
- Redis configuration added
- CORS origins configured
- Rate limiting enabled

### 4. ✅ GitHub Repository Updated
- Latest changes committed
- Pushed to master branch
- Pushed to main branch
- Repository: https://github.com/secure-Linkss/Full-stack-restructured.git

---

## 🚀 Vercel Deployment Instructions

### Option 1: Deploy via Vercel Dashboard (RECOMMENDED)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login with your account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `secure-Linkss/Full-stack-restructured`

3. **Configure Project**
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

4. **Set Environment Variables** (CRITICAL)
   Add these in Vercel project settings:

   ```
   SECRET_KEY=ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE
   DATABASE_URL=postgresql://neondb_owner:npg_7CcKbPRm2GDw@ep-odd-thunder-ade4ip4a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   SHORTIO_API_KEY=sk_DbGGlUHPN7Z9VotL
   SHORTIO_DOMAIN=Secure-links.short.gy
   FLASK_ENV=production
   FLASK_APP=api/index.py
   REDIS_HOST=redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com
   REDIS_PORT=15183
   REDIS_PASSWORD=8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm
   REDIS_URL=redis://:8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm@redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com:15183/0
   RATELIMIT_ENABLED=True
   RATELIMIT_STORAGE_URL=redis://:8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm@redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com:15183/0
   ALLOWED_ORIGINS=https://brain-link-tracker.vercel.app,https://www.brainlinktracker.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at: `https://brain-link-tracker.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI locally (in project directory)
npm install vercel

# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod

# Follow the prompts and set environment variables when asked
```

---

## 📋 Post-Deployment Verification

### 1. Test Homepage
- Visit your Vercel URL
- Verify homepage loads correctly
- Check pricing section is visible

### 2. Test User Registration
- Navigate to registration page
- Select a plan
- Complete registration form
- Verify plan selection is saved

### 3. Test Payment Flow
- Go to payment page
- Verify crypto payment form displays
- Test transaction hash submission
- Check form validation

### 4. Test Admin Login
**Main Admin:**
- Username: `Brain`
- Password: `Mayflower1!!`

**Admin:**
- Username: `7thbrain`
- Password: `Mayflower1!`

### 5. Test API Endpoints
- Check `/api/health` endpoint
- Verify database connections work
- Test authentication endpoints
- Confirm Redis caching works

### 6. Test All Action Buttons
- Create link button
- Payment submission button
- Admin approval buttons
- User management buttons

---

## 🔧 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify `package.json` scripts are correct
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon database is accessible
- Ensure SSL mode is enabled

### Redis Connection Issues
- Verify Redis credentials
- Check Redis endpoint is accessible
- Ensure port 15183 is not blocked

### Frontend Not Loading
- Check dist folder was built correctly
- Verify static files are served properly
- Check browser console for errors

---

## 📊 Current Status

✅ **Frontend**: Rebuilt with latest payment UI  
✅ **Backend**: Flask API ready  
✅ **Database**: PostgreSQL connected (29 tables)  
✅ **Redis**: Configured for caching  
✅ **GitHub**: Code pushed to master and main  
⏳ **Vercel**: Ready for deployment  

---

## 🎯 Next Steps

1. Deploy to Vercel using Option 1 (Dashboard) - RECOMMENDED
2. Set all environment variables in Vercel
3. Test the deployed application
4. Verify all features work correctly
5. Monitor logs for any errors

---

## 📞 Support

If you encounter any issues:
- Check Vercel deployment logs
- Review browser console errors
- Verify all environment variables are set
- Test database and Redis connections

---

**Deployment Date**: November 12, 2025  
**Repository**: https://github.com/secure-Linkss/Full-stack-restructured.git  
**Status**: Ready for Production Deployment