# Vimeo API Integration Guide

This guide will help you set up Vimeo API access for the connector that automatically imports your Vimeo likes into your site.

## Prerequisites

- A Vimeo account (with liked videos that you want to display)
- Access to [Vimeo Developer Portal](https://developer.vimeo.com/)

## Step 1: Create a Vimeo App

1. Go to the [Vimeo Developer Portal](https://developer.vimeo.com/)
2. Sign in with your Vimeo account
3. Navigate to "My Apps" in the top navigation
4. Click the "Create App" button
5. Fill in the following information:
   - **App Name**: MattFisher.io (or any name you prefer)
   - **App Description**: Personal website that displays my Vimeo likes
   - **App URL**: Your website URL (e.g., https://mattfisher.io)
   - **App Callback URLs**: Your website URL (e.g., https://mattfisher.io)
6. Under "App Category," select "Website"
7. Click "Create App"

## Step 2: Generate a Personal Access Token

1. In your newly created app, go to the "Authentication" tab
2. Under "Generate an access token," select the following scopes:
   - `public`
   - `private`
   - `interact`
3. Click "Generate" to create your access token
4. Copy the generated access token (you'll need it for the `.env` file)

## Step 3: Configure Your Environment Variables

1. In your project, make sure you have a `.env` file in the root directory
2. Add the following line to your `.env` file:

```
VIMEO_ACCESS_TOKEN=your_access_token_here
```

3. Replace `your_access_token_here` with the actual access token you generated

## Step 4: Test the Integration

Run the following command to verify your Vimeo API access token:

```bash
npm run verify-vimeo
```

If successful, you should see a confirmation message and information about your Vimeo account and likes.

Next, run the connector to fetch your liked videos:

```bash
npm run update-pins
```

If everything is set up correctly, your Vimeo likes should be imported and saved to `docs/pins/vimeo.md`.

## Troubleshooting

### "Unauthorized" or "401" error

If you see an error about unauthorized access, your token may have expired or be invalid. Generate a new access token in the Vimeo Developer Dashboard with the correct permissions.

### No videos being imported

Make sure:
1. You have videos that you've liked on Vimeo
2. Your access token has the correct permissions (especially `interact`)
3. Your Vimeo account is active and in good standing

### Rate limit issues

Vimeo has API rate limits. If you hit these limits, wait a while before trying again.

## Additional Resources

- [Vimeo API Documentation](https://developer.vimeo.com/api/reference)
- [Vimeo Authentication Documentation](https://developer.vimeo.com/api/authentication)
