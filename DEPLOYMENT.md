# Vercel Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables
Make sure you have the following environment variables ready:

- ✅ **VITE_SUPABASE_URL** - Your Supabase project URL
  - Get it from: https://app.supabase.com/project/_/settings/api
  - Format: `https://xxxxx.supabase.co`

- ✅ **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key
  - Get it from: https://app.supabase.com/project/_/settings/api
  - This is safe to expose in client-side code

- ✅ **GEMINI_API_KEY** - Your Google Gemini API key
  - Get it from: https://makersuite.google.com/app/apikey
  - This is used for AI-powered reports

### 2. Code Preparation
- ✅ All code is committed to Git
- ✅ `.env` file is in `.gitignore` (already configured)
- ✅ `vercel.json` is created and configured
- ✅ Build script works locally (`npm run build`)

### 3. Database Setup
- ✅ Supabase migrations are run
- ✅ Database schema is up to date
- ✅ RLS (Row Level Security) policies are configured
- ✅ Storage buckets are created (for avatars)

## Deployment Steps

### Step 1: Push to Git Repository
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Sign in with your GitHub/GitLab/Bitbucket account
3. Import your repository
4. Vercel will auto-detect it's a Vite project

### Step 3: Configure Environment Variables
In the Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add each variable:
   - `VITE_SUPABASE_URL` = `your_supabase_url`
   - `VITE_SUPABASE_ANON_KEY` = `your_supabase_anon_key`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
3. Make sure to add them for **Production**, **Preview**, and **Development** environments

### Step 4: Deploy
1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Post-Deployment

### Test Your Deployment
1. ✅ Visit your Vercel URL
2. ✅ Test authentication (sign in)
3. ✅ Test protected routes
4. ✅ Test role-based access (sponsor vs team member)
5. ✅ Test AI report generation (requires GEMINI_API_KEY)
6. ✅ Test file uploads (avatars)

### Common Issues

#### Issue: Environment variables not working
**Solution:** 
- Make sure variables are prefixed with `VITE_` for client-side access
- Redeploy after adding environment variables
- Check Vercel logs for errors

#### Issue: Routes not working (404 errors)
**Solution:**
- The `vercel.json` file should handle this with rewrites
- Make sure you're using HashRouter (already configured)

#### Issue: Build fails
**Solution:**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Try building locally first: `npm run build`

#### Issue: Supabase connection errors
**Solution:**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Verify RLS policies allow access

## Vercel Configuration

The `vercel.json` file includes:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: `vite`
- ✅ Rewrites for SPA routing
- ✅ Cache headers for static assets

## Monitoring

After deployment, monitor:
- Vercel Analytics (if enabled)
- Error logs in Vercel dashboard
- Supabase logs for database issues
- User feedback on functionality

## Updating Your Deployment

To update your deployment:
1. Make changes to your code
2. Commit and push to Git
3. Vercel will automatically redeploy

Or manually trigger:
1. Go to Vercel dashboard
2. Click **Redeploy** on the latest deployment

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test locally first to isolate issues

