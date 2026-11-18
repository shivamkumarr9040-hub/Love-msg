# Love Story Creator — Supabase edition

This project uses React + Vite + Supabase. Firebase is not used.

## 1. Create the Supabase project
1. Open https://supabase.com and create a project.
2. Choose a region close to your users (Mumbai if available).
3. Wait until the project is ready.

## 2. Create the database and storage policies
1. In Supabase, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy the entire file and paste it into SQL Editor.
3. Click **Run**. This creates the `love_sites` table, row-level security policies and the public `love-assets` storage bucket.
4. In **Authentication → Providers**, make sure Email is enabled.
5. For easier first testing, in **Authentication → URL Configuration**, set Site URL to your local app URL while testing (usually `http://localhost:5173`). Add your deployed URL to Redirect URLs later. Keep email confirmation enabled for a real public launch.

## 3. Add Supabase keys
1. In Supabase, open **Project Settings → API** (or the API Keys page).
2. Copy the **Project URL**.
3. Copy the **Publishable key** (or legacy `anon` key). Never use the `service_role` or secret key in a browser app.
4. In the project folder, duplicate `.env.example` and name the copy `.env`.
5. Fill it like this:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Do not add quotes. Do not share your `.env` file or commit it to a public repository.

## 4. Run on your computer
Install Node.js LTS from https://nodejs.org. Then open a terminal in this folder and run:

```bash
npm install
npm run dev
```

Open the local address Vite prints (normally http://localhost:5173).

## 5. Test the app
1. Sign up with your email and a password of at least 6 characters.
2. If email confirmation is enabled, confirm the email, then log in.
3. Create a love page, add questions, optionally upload an image/GIF and audio.
4. Tick **Publish this page**, then click **Save page**.
5. Copy the public link. Open it in a private/incognito browser to test it as a visitor.

## 6. Deploy
Recommended: deploy the project on Vercel. Import the GitHub repository and add these environment variables in Vercel Project Settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build command: `npm run build`
Output directory: `dist`

After deployment, add your Vercel domain under Supabase **Authentication → URL Configuration → Redirect URLs** and set the Site URL to your deployed domain.

## Important notes
- This is a starter implementation, not a security or production audit. Test signup, login, editing, publishing, sharing and uploads before sharing widely.
- The app uses a public bucket for media so published pages can display uploaded assets. Anyone who has an asset URL can view that asset. Do not upload private photos or sensitive files.
- Browser audio autoplay is often blocked until the visitor taps the audio controls; this is controlled by the browser.
- The “NO” button moves playfully after taps; it does not prevent keyboard or accessibility users from selecting other controls.
- A custom slug must be unique. If someone already uses it, Supabase will show a duplicate-key error; choose another slug.
- No admin superuser is preconfigured. Each registered account manages only its own pages through Supabase Row Level Security.
