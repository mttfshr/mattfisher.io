# Handling Google Verification Screen for YouTube Connector

When you first run `npm run youtube-auth`, you might see a Google verification screen with a warning message like:

> "mattfisher.io has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

This is normal for personal projects using Google's APIs. Here's how to proceed:

## Step 1: Ensure You're Added as a Test User

First, make sure your Google email (the one you're signed in with) is added as a test user in your Google Cloud Console:

1. Go to your Google Cloud Console project
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Scroll down to the "Test users" section
4. Click "Add Users" and add your Google email 
5. Save the changes

## Step 2: Navigate Past the Warning Screen

When running the authentication:

1. Click on the "Continue" or "Advanced" option on the warning screen
2. You might see a link saying "Go to mattfisher.io (unsafe)" - click on this link
3. This will proceed to the normal OAuth consent screen
4. Then authorize the app to access your YouTube data

## Step 3: Complete the Authorization

After granting access, you'll be redirected to the local callback URL, and the process will complete automatically.

## Why This Happens

Google requires a verification process for apps requesting sensitive API access before they can be used by the general public. Since this is a personal project where you're both the developer and the only user, you can bypass this by adding yourself as a test user.

You will not need to repeat this process unless:
- You revoke the app's permissions in your Google account
- Your refresh token expires (very rare)
- You change the scopes requested by the application

## Alternative Approach for Production

If you plan to make your application public and accessible to others later, you would need to:

1. Complete Google's verification process
2. Add a privacy policy
3. Provide additional documentation about how user data is used

However, for a personal website that only accesses your own YouTube data, the test user approach is sufficient.
