# Google OAuth Setup Guide

Follow these steps to set up Google OAuth for the Airtable Clone:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Airtable Clone")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing)
   - App name: "Airtable Clone" (or your choice)
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Save and Continue" (default is fine)
   - Test users: Add your email, click "Save and Continue"
   - Click "Back to Dashboard"

4. Now create the OAuth client:
   - Application type: **Web application**
   - Name: "Airtable Clone Local" (or your choice)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

5. **Copy the Client ID and Client Secret** to your `.env` file:
   ```
   AUTH_GOOGLE_ID="your-client-id-here.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-client-secret-here"
   ```

## Step 4: Update Your .env File

Open the `.env` file in the project root and paste your credentials:

```env
AUTH_GOOGLE_ID="your-client-id-here"
AUTH_GOOGLE_SECRET="your-client-secret-here"
```

## Step 5: Set Up Database

Make sure you have a PostgreSQL database running. Update `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/airtable_clone"
```

Then run:
```bash
npm run db:push
```

## Step 6: Restart the Dev Server

After updating `.env`, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### "Access blocked: authorization error"

This usually means:
1. The redirect URI in Google Cloud Console doesn't match exactly
2. The OAuth consent screen isn't configured
3. Your email isn't added as a test user (if using external user type)

**Fix:**
- Double-check the redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`
- Make sure you've completed the OAuth consent screen setup
- Add your email as a test user in the OAuth consent screen

### "redirect_uri_mismatch"

The redirect URI in your request doesn't match the one in Google Cloud Console.

**Fix:**
- Go to Google Cloud Console > Credentials
- Edit your OAuth 2.0 Client ID
- Make sure "Authorized redirect URIs" includes: `http://localhost:3000/api/auth/callback/google`
- Save and wait a few minutes for changes to propagate

### Still having issues?

1. Make sure you're using the correct Client ID and Secret (no extra spaces)
2. Clear your browser cache and cookies
3. Try an incognito/private window
4. Check the browser console for detailed error messages
