<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# فيء (Faye) - Orphan Care Management System

A comprehensive orphan care management system built with React, TypeScript, and Supabase.

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deploy to Vercel

### Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import your project to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will automatically detect it's a Vite project

3. **Configure Environment Variables:**
   In the Vercel project settings, add the following environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `GEMINI_API_KEY` - Your Google Gemini API key

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Your app will be live at `https://your-project.vercel.app`

### Environment Variables in Vercel

To add environment variables in Vercel:
1. Go to your project dashboard
2. Click on "Settings"
3. Navigate to "Environment Variables"
4. Add each variable:
   - **VITE_SUPABASE_URL**: Get from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)
   - **VITE_SUPABASE_ANON_KEY**: Get from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)
   - **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Important Notes

- The app uses **HashRouter** which works perfectly with Vercel's static hosting
- All routes are configured in `vercel.json` to redirect to `index.html`
- The build output directory is `dist` (configured in `vercel.json`)
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- The `GEMINI_API_KEY` is used server-side only (via Vite's define config)

## Project Structure

```
faye/
├── components/          # React components
├── contexts/            # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── lib/                # Library configurations (Supabase)
├── supabase/           # Database migrations
├── types.ts            # TypeScript type definitions
├── utils/              # Utility functions
├── vercel.json         # Vercel deployment configuration
└── vite.config.ts      # Vite build configuration
```

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - Backend (database, auth, storage)
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Google Gemini AI** - AI-powered reports

## License

Private project - All rights reserved
