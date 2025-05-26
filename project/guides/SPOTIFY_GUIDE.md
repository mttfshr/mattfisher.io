# Spotify API Integration Guide

This guide explains how to set up and use the Spotify API integration for automatically fetching your Spotify favorites (albums and playlists) into your pins section.

## 1. Register a Spotify Application

First, you need to register an application with Spotify:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name (e.g., "MattFisher.io Pins") and description
5. For Redirect URI, enter: `http://localhost:8888/callback`
6. Accept the terms and click "Create"
7. Once created, note your Client ID and Client Secret

## 2. Configure Environment Variables

Create a `.env` file in your project root (or edit the existing one) based on the `.env.example` template:

```
# Spotify API credentials
SPOTIFY_CLIENT_ID=your_client_id_from_dashboard
SPOTIFY_CLIENT_SECRET=your_client_secret_from_dashboard
SPOTIFY_REFRESH_TOKEN=you_will_get_this_in_step_3
```

## 3. Run the Authentication Process

To obtain a refresh token that allows your application to access your Spotify data:

```bash
npm run spotify-auth
```

This will:
1. Start a local server on port 8888
2. Open a Spotify authorization page in your browser
3. After you approve, generate a refresh token
4. Save the token to a config file and display it in the console

Take the refresh token displayed in the console and add it to your `.env` file as `SPOTIFY_REFRESH_TOKEN`.

## 4. Update Spotify Pins

Once you have your authentication set up, you can update your Spotify pins with:

```bash
npm run update-pins
```

This will:
1. Fetch your saved albums from Spotify
2. Fetch your playlists from Spotify
3. Generate a `pins/spotify.md` file with all your favorites formatted as pins
4. Each entry will include appropriate hashtags (#music #spotify #album/#playlist)

## How It Works

The Spotify integration consists of three main components:

1. **spotifyAuth.js**: Handles the OAuth 2.0 authentication flow to get a refresh token
2. **spotify.js**: Fetches data from Spotify and formats it into a Markdown file
3. **index.js**: Orchestrates the update process and handles errors

The refresh token never expires unless you explicitly revoke access, so you only need to run the authentication process once.

## Troubleshooting

If you encounter issues:

### "INVALID_CLIENT: Invalid redirect URI" Error

This is the most common error and occurs when the redirect URI in your code doesn't exactly match what you registered in the Spotify Developer Dashboard.

To fix this:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Select your app
3. Click "Edit Settings"
4. Under "Redirect URIs", make sure you have exactly: `http://localhost:8888/callback`
5. Save the changes
6. Try running `npm run spotify-auth` again

The redirect URI must match exactly - including http vs https, trailing slashes, etc.

### Other Common Issues

- **"Missing Spotify API credentials"**: Check that your `.env` file contains the correct credentials
- **Authentication errors**: Make sure you've properly set up the client ID and client secret
- **Rate limiting**: Spotify has API rate limits; avoid running updates too frequently

### Verification Tool

Run the verification tool to check your configuration:

```bash
npm run verify-spotify
```

This will check that your environment variables are set up correctly and provide troubleshooting steps.

## Customizing

You can customize the Spotify integration by:

1. Editing the `spotify.js` file to change what content is fetched
2. Modifying the markdown formatting in the same file
3. Adjusting the hashtags used for categorization

The current implementation fetches:
- Your saved albums (up to 50)
- Your created playlists (up to 50)

You can modify the script to fetch other content types like followed artists, saved tracks, etc.
