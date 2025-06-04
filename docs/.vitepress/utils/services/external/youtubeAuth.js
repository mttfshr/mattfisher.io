// Fixed youtubeAuth.js
import dotenv from 'dotenv';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import verifyYoutubeConfig from './verifyYoutubeConfig.js';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
const envPath = path.join(projectRoot, '.env');

// Port for the local callback server
const PORT = 3000;

async function authorizeYoutube() {
  console.log('🔑 Starting YouTube authorization process...');
  
  // First verify the configuration
  const configStatus = await verifyYoutubeConfig();
  
  if (!configStatus.clientId || !configStatus.clientSecret) {
    console.error('\n❌ Missing client ID or client secret!');
    console.error('Please set them up first, then run this script again.');
    process.exit(1);
  }
  
  if (configStatus.refreshToken) {
    console.log('\n⚠️ You already have a refresh token in your .env file.');
    console.log('Continuing will replace your existing token.');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Debug: show the .env path we'll be using
  console.log(`📁 Using .env file: ${envPath}`);
  
  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `http://localhost:${PORT}/callback`
  );
  
  // Generate an authentication URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    // Use a more specific scope for just reading liked videos
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    prompt: 'consent',  // Force to always get refresh_token
    include_granted_scopes: true
  });
  
  // Function to extract and save refresh token
  const saveRefreshToken = async (code) => {
    try {
      console.log('\n🔄 Exchanging authorization code for tokens...');
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received! Make sure you are using "prompt: consent" and have revoked access if retrying.');
      }
      
      console.log('✅ Received refresh token: ', tokens.refresh_token);
      console.log(`🔧 Updating .env file at: ${envPath}`);
      
      // Read the current .env file
      let envContent = '';
      try {
        envContent = await fs.readFile(envPath, 'utf8');
        console.log('📖 Successfully read existing .env file');
      } catch (error) {
        console.log('📝 Creating new .env file');
        envContent = '# Environment Variables\n';
      }
      
      // Show current content for debugging (but hide sensitive values)
      const currentLines = envContent.split('\n');
      const youtubeLine = currentLines.find(line => line.startsWith('YOUTUBE_REFRESH_TOKEN='));
      if (youtubeLine) {
        console.log(`🔍 Found existing line: YOUTUBE_REFRESH_TOKEN=${youtubeLine.split('=')[1] ? '[HIDDEN]' : '[EMPTY]'}`);
      } else {
        console.log('🔍 No existing YOUTUBE_REFRESH_TOKEN line found');
      }
      
      // More robust replacement logic
      const newTokenLine = `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`;
      
      if (envContent.includes('YOUTUBE_REFRESH_TOKEN=')) {
        // Replace existing line
        console.log('🔄 Replacing existing YOUTUBE_REFRESH_TOKEN line...');
        envContent = envContent.replace(
          /YOUTUBE_REFRESH_TOKEN=.*$/m,
          newTokenLine
        );
      } else {
        // Add new line
        console.log('➕ Adding new YOUTUBE_REFRESH_TOKEN line...');
        // Ensure there's a newline before adding
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += `${newTokenLine}\n`;
      }
      
      // Write back to .env file
      await fs.writeFile(envPath, envContent, 'utf8');
      console.log('💾 Successfully wrote to .env file');
      
      // Verify the write by reading it back
      try {
        const verifyContent = await fs.readFile(envPath, 'utf8');
        const verifyLines = verifyContent.split('\n');
        const verifyTokenLine = verifyLines.find(line => line.startsWith('YOUTUBE_REFRESH_TOKEN='));
        
        if (verifyTokenLine && verifyTokenLine.includes(tokens.refresh_token)) {
          console.log('✅ Verification successful: Token was saved correctly');
        } else {
          console.log('⚠️ Verification failed: Token may not have been saved correctly');
          console.log(`Expected to find: YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token.substring(0, 20)}...`);
          console.log(`Actually found: ${verifyTokenLine || 'No line found'}`);
        }
      } catch (verifyError) {
        console.log('⚠️ Could not verify file write:', verifyError.message);
      }
      
      console.log('\n✅ YouTube refresh token saved successfully!');
      console.log('You can now use: npm run update-pins:youtube');
      console.log('\n💡 Note: You may need to restart any running development servers');
      console.log('   to pick up the new environment variable.');
      
      return true;
    } catch (error) {
      console.error('\n❌ Error getting tokens:', error.message);
      console.error('Make sure your redirect URI is correctly set in Google Cloud Console.');
      
      // Additional debugging for common issues
      if (error.message.includes('invalid_client')) {
        console.error('\n🔧 Troubleshooting tips:');
        console.error('- Check that YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET are correct');
        console.error('- Make sure the redirect URI http://localhost:3000/callback is added in Google Cloud Console');
      }
      
      return false;
    }
  };
  
  // Create a simple HTTP server to handle the callback
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/callback') {
        // Get the authorization code from the callback
        const code = parsedUrl.query.code;
        
        if (code) {
          console.log('\n🎉 Received authorization code from Google');
          
          // Send a response to the browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>YouTube Authorization Complete</title>
                <style>
                  body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f9f9f9;
                  }
                  .container {
                    text-align: center;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    background-color: white;
                    max-width: 500px;
                  }
                  h1 { color: #4285F4; }
                  .success { color: #34A853; }
                  .error { color: #EA4335; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>YouTube Authorization</h1>
                  <p id="status">Processing authorization...</p>
                  <p>You can close this window once the process is complete.</p>
                </div>
                <script>
                  // This is just for the user's visual feedback
                  setTimeout(() => {
                    document.getElementById('status').innerHTML = 
                      '<span class="success">✅ Authorization successful! Check your terminal for details.</span>';
                  }, 1000);
                </script>
              </body>
            </html>
          `);
          
          // Handle the token exchange in the background
          const success = await saveRefreshToken(code);
          
          // Close the server after a short delay
          setTimeout(() => {
            server.close();
            process.exit(success ? 0 : 1);
          }, 3000);
        } else {
          // Handle error case
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>YouTube Authorization Failed</title>
                <style>
                  body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f9f9f9;
                  }
                  .container {
                    text-align: center;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    background-color: white;
                    max-width: 500px;
                  }
                  h1 { color: #4285F4; }
                  .error { color: #EA4335; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>YouTube Authorization</h1>
                  <p class="error">❌ Authorization failed! No code received.</p>
                  <p>Please check the console for more information.</p>
                </div>
              </body>
            </html>
          `);
          
          console.error('\n❌ Authorization failed: No code received');
          console.error('This might happen if you declined the authorization or if there was a network issue.');
          
          // Close the server after a short delay
          setTimeout(() => {
            server.close();
            process.exit(1);
          }, 3000);
        }
      } else {
        // Handle other routes
        res.writeHead(404);
        res.end();
      }
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500);
      res.end('Server error');
      
      // Close the server after a short delay
      setTimeout(() => {
        server.close();
        process.exit(1);
      }, 3000);
    }
  });
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`\n🌐 Authorization server started at http://localhost:${PORT}`);
    console.log('\n🔍 Opening browser for YouTube authorization...');
    console.log('📝 You will need to:');
    console.log('1. Sign in with your Google account');
    console.log('2. Grant permission to access your YouTube data');
    
    // Open the authorization URL in the default browser
    open(authUrl);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error(`\n❌ Server error: ${error.message}`);
    
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please close other applications using this port and try again.`);
    }
    
    process.exit(1);
  });
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  authorizeYoutube().catch(error => {
    console.error('\n❌ Authorization error:', error);
    process.exit(1);
  });
}

export default authorizeYoutube;