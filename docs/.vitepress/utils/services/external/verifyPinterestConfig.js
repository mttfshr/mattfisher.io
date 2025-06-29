// Verify Pinterest API configuration
import dotenv from 'dotenv';

dotenv.config();

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;

async function verifyPinterestConfig() {
  console.log('🔍 Verifying Pinterest API configuration...\n');

  // Check if access token is provided
  if (!PINTEREST_ACCESS_TOKEN) {
    console.error('❌ PINTEREST_ACCESS_TOKEN not found in environment variables');
    console.log('\n📋 To set up Pinterest API access:');
    console.log('1. Go to https://developers.pinterest.com/');
    console.log('2. Create a new app or use an existing one');
    console.log('3. Generate an access token with the following scopes:');
    console.log('   - boards:read');
    console.log('   - pins:read');
    console.log('4. Add PINTEREST_ACCESS_TOKEN=your_token_here to your .env file');
    console.log('\n💡 Make sure your Pinterest boards are set to public or that your token has access to private boards');
    return false;
  }

  // Test API access
  try {
    console.log('🔗 Testing Pinterest API connection...');
    console.log('🔐 Using token (last 10 chars):', PINTEREST_ACCESS_TOKEN.slice(-10));
    
    // Try the user account endpoint first
    let response = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Try to get more details from the error response
      const errorText = await response.text();
      console.log('📋 Error details:', errorText);
      
      // If user_account fails, try a simpler endpoint like boards
      console.log('\n🔄 Trying boards endpoint directly...');
      response = await fetch('https://api.pinterest.com/v5/boards', {
        headers: {
          'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Boards response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const boardsError = await response.text();
        console.log('📋 Boards error details:', boardsError);
        throw new Error(`Pinterest API error: ${response.status} ${response.statusText}`);
      }
    }

    const userData = await response.json();
    console.log('✅ Pinterest API connection successful!');
    console.log(`👤 Connected to account: ${userData.username || 'Unknown'}`);
    
    // Test boards access
    console.log('\n🔗 Testing boards access...');
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!boardsResponse.ok) {
      throw new Error(`Boards API error: ${boardsResponse.status} ${boardsResponse.statusText}`);
    }

    const boardsData = await boardsResponse.json();
    const boardCount = boardsData.items?.length || 0;
    
    console.log(`✅ Boards access successful!`);
    console.log(`📌 Found ${boardCount} accessible boards`);
    
    if (boardCount === 0) {
      console.log('\n⚠️  No boards found. This could mean:');
      console.log('   - You have no boards created');
      console.log('   - Your access token doesn\'t have permission to read boards');
      console.log('   - All your boards are private and token lacks private board access');
    } else {
      console.log('\n📋 Sample boards:');
      boardsData.items.slice(0, 3).forEach(board => {
        console.log(`   - "${board.name}" (${board.pin_count || 0} pins, ${board.privacy})`);
      });
    }

    console.log('\n🎉 Pinterest configuration is valid!');
    console.log('\n🚀 You can now run:');
    console.log('   npm run update-pins:pinterest');
    console.log('   npm run update-pins (to include Pinterest with other sources)');
    
    return true;

  } catch (error) {
    console.error('❌ Pinterest API verification failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check that your access token is valid and not expired');
    console.log('2. Verify the token has boards:read and pins:read scopes');
    console.log('3. Make sure your boards are accessible with the current token');
    console.log('4. If using private boards, ensure the token has appropriate permissions');
    
    return false;
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyPinterestConfig().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default verifyPinterestConfig;
