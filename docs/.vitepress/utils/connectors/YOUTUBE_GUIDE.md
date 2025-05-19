# YouTube API Setup Guide

This guide will help you set up the YouTube API credentials needed to fetch your liked videos.

## Prerequisites

1. A Google account with access to YouTube
2. A Google Cloud Platform (GCP) account (free)

## Step 1: Set Up a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled for your project (API usage within free quota is free)

## Step 2: Enable the YouTube Data API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on the API and click "Enable"

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (unless you have a Google Workspace account)
   - App name: "MattFisher.io" (or whatever you prefer)
   - User support email: Your email
   - Developer contact information: Your email
   - Click "Save and Continue" through the remaining sections
4. For the OAuth client ID:
   - Application type: "Web application"
   - Name: "MattFisher.io YouTube Connector" (or whatever you prefer)
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/callback`
   - Click "Create"
5. Note the Client ID and Client Secret (you'll need these in the next step)

## Step 4: Add Credentials to Your .env File

Add the following to your `.env` file:

```
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

## Step 5: Obtain a Refresh Token

Run the authentication script:

```
npm run youtube-auth
```

This will:
1. Open a browser window
2. Prompt you to log in to your Google account
3. Ask for permission to access your YouTube data

**Important Note About Verification:**
When authorizing, you might see a warning that "mattfisher.io has not completed the Google verification process." This is normal for personal projects.

To proceed:
1. Make sure the Google account you're using is added as a "Test User" in your Google Cloud Console project
2. Click "Advanced" or "Continue" on the warning screen
3. Click "Go to mattfisher.io (unsafe)" to proceed

For detailed instructions on handling this verification screen, see:
`docs/.vitepress/utils/connectors/GOOGLE_VERIFICATION_GUIDE.md`

## Step 6: Test the Connection

Run the YouTube connector:

```
npm run update-pins:youtube
```

This should fetch your liked videos and save them to `docs/pins/youtube.md`.

## Troubleshooting

### Invalid Grant Error

If you receive an "invalid_grant" error, your refresh token might be invalid or expired. Try:

1. Revoking access to the application at [Google Account Permissions](https://myaccount.google.com/permissions)
2. Running `npm run youtube-auth` again to get a new token

### API Limits

The YouTube Data API has a quota of 10,000 units per day. Each request to fetch liked videos costs about 1-5 units depending on the parameters. This should be more than enough for personal use.

### Other Issues

If you encounter other issues:

1. Check your GCP console for any error messages
2. Ensure the YouTube Data API is enabled
3. Verify that your OAuth consent screen is configured correctly
4. Check that the redirect URI exactly matches `http://localhost:3000/callback`
