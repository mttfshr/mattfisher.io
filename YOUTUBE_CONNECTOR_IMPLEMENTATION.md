# YouTube Connector Implementation

## Overview

The YouTube connector allows your personal website to automatically fetch videos you've liked on YouTube and include them in your pins collection. The implementation uses OAuth 2.0 authentication to securely access your YouTube liked videos data.

## Components Created

1. **YouTube OAuth Connector** (`youtube.js`)
   - Fetches your liked videos from YouTube
   - Formats them as markdown entries for the pins section
   - Includes proper error handling and pagination support

2. **Authentication Flow** (`youtubeAuth.js`) 
   - Manages the OAuth 2.0 authentication process
   - Creates a local server to handle the callback from Google
   - Securely stores the refresh token in your .env file

3. **Configuration Verification** (`verifyYoutubeConfig.js`)
   - Checks that all required credentials are present
   - Provides helpful guidance when credentials are missing

4. **Documentation** (`YOUTUBE_GUIDE.md`)
   - Step-by-step instructions for setting up YouTube API access
   - Troubleshooting guidance for common issues

5. **Integration with Existing System**
   - Updated connectors/index.js to include YouTube
   - Added NPM scripts for YouTube-specific operations
   - Updated .env.example with YouTube credentials fields

## New NPM Scripts

These scripts have been added to package.json:

- `npm run update-pins:youtube` - Fetch and update YouTube liked videos
- `npm run youtube-auth` - Run the OAuth authentication flow to get a refresh token
- `npm run verify-youtube` - Check YouTube API configuration status
- `npm run update-youtube-full` - Update YouTube pins and refresh OG cache for YouTube pins
- `npm run generate-og-cache:youtube` - Update OG cache for YouTube pins specifically

## Setup Process

1. **Set up Google Cloud Project**
   - Create a project in Google Cloud Console
   - Enable the YouTube Data API v3
   - Create OAuth 2.0 credentials

2. **Configure Environment Variables**
   - Add YouTube client ID and client secret to .env file

3. **Run Authentication**
   - Execute `npm run youtube-auth`
   - Follow the browser prompts to authorize access
   - Refresh token will be automatically saved to .env

4. **Fetch YouTube Liked Videos**
   - Run `npm run update-pins:youtube`
   - Liked videos will be saved to docs/pins/youtube.md

## Architecture Decisions

1. **OAuth vs API Key**
   - Chose OAuth because accessing liked videos requires user authentication
   - Implemented the refresh token flow for automated script running

2. **Error Handling Strategy**
   - Progressive degradation - maintains existing files if API fails
   - Detailed error messages with guidance for fixing issues
   - Clear console output for debugging

3. **Pagination Support**
   - Handles YouTube API's 50-item limit per request
   - Fetches all pages to get complete list of liked videos

4. **Integration Points**
   - Follows the same pattern as Spotify and Vimeo connectors
   - Fully integrated with the OG cache update system

## Next Steps

1. **Test the YouTube Connector**
   - Run `npm run verify-youtube` to check configuration
   - Set up required credentials following the guide
   - Run `npm run youtube-auth` to get refresh token
   - Test with `npm run update-pins:youtube`

2. **Potential Enhancements**
   - Add support for other YouTube data (playlists, subscriptions)
   - Implement video thumbnail caching
   - Add date filtering options (e.g., only fetch videos liked in the last month)
   - Add sorting options (by date, popularity, etc.)

## References

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3/docs)
- [Google OAuth 2.0 Guidance](https://developers.google.com/identity/protocols/oauth2)
