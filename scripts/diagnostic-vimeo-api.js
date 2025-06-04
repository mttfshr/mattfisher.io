#!/usr/bin/env node

/**
 * Vimeo API Diagnostic Tool
 * Tests endpoints used by the import script to identify connection issues
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function testAuthentication(accessToken) {
  console.log('🔐 Testing Authentication...');
  
  try {
    const response = await fetch('https://api.vimeo.com/me', {
      headers: {
        'Authorization': `bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const user = await response.json();
    
    console.log(`   ✅ Authenticated as: ${user.name}`);
    console.log(`   🎬 Videos uploaded: ${user.metadata?.connections?.videos?.total || 'Unknown'}`);
    console.log(`   ❤️ Videos liked: ${user.metadata?.connections?.likes?.total || 'Unknown'}`);
    
    return { success: true, user };
  } catch (error) {
    console.log(`   ❌ Authentication failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testVideoEndpoints(accessToken) {
  console.log('\n🎥 Testing Video Endpoints...');
  
  const endpoints = [
    {
      name: 'All Videos (no filter)',
      url: 'https://api.vimeo.com/me/videos?per_page=5&fields=name,uri,created_time,duration,privacy.view'
    },
    {
      name: 'Embeddable Videos Only',
      url: 'https://api.vimeo.com/me/videos?per_page=5&filter=embeddable&fields=name,uri,created_time,duration,privacy.view'
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`\n   Testing: ${endpoint.name}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      });

      const data = await response.json();
      
      console.log(`      ✅ Success: ${data.data?.length || 0} videos returned`);
      console.log(`      📊 Total available: ${data.total || 'Unknown'}`);
      
      if (data.data && data.data.length > 0) {
        console.log(`      📱 Sample: "${data.data[0].name}"`);
        if (data.data[0].privacy) {
          console.log(`      🔒 Privacy: ${data.data[0].privacy.view}`);
        }
      }
      
      results.push({
        endpoint: endpoint.name,
        success: true,
        videoCount: data.data?.length || 0,
        totalAvailable: data.total || 0
      });
      
    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      results.push({
        endpoint: endpoint.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}async function runDiagnostic() {
  console.log('🎬 Vimeo API Diagnostic Tool\n');
  
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ Missing VIMEO_ACCESS_TOKEN in environment variables');
    process.exit(1);
  }
  
  console.log(`🔍 Testing token: ${accessToken.substring(0, 8)}...\n`);
  
  // Run tests
  const authResult = await testAuthentication(accessToken);
  const videoResults = await testVideoEndpoints(accessToken);
  
  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════');
  
  if (authResult.success) {
    console.log(`✅ Authentication: Success`);
  } else {
    console.log(`❌ Authentication: Failed`);
    return;
  }
  
  const successfulEndpoints = videoResults.filter(t => t.success);
  const videoCounts = successfulEndpoints.map(t => t.totalAvailable).filter(c => c > 0);
  
  console.log(`📊 Video Endpoints: ${successfulEndpoints.length}/${videoResults.length} successful`);
  
  if (videoCounts.length > 0) {
    const maxVideos = Math.max(...videoCounts);
    console.log(`🎬 Maximum videos found: ${maxVideos}`);
    
    if (maxVideos === 0) {
      console.log('\n⚠️  ROOT CAUSE: No videos found');
      console.log('   Possible reasons:');
      console.log('   1. Account has no uploaded videos');
      console.log('   2. All videos are private/unlisted');
      console.log('   3. Videos require different filters');
    } else {
      console.log('\n✅ Videos found! Import should work.');
    }
  }
  
  console.log('\n💡 RECOMMENDATIONS');
  console.log('═══════════════════');
  
  if (!authResult.success) {
    console.log('1. Regenerate Vimeo access token');
    console.log('2. Ensure token has "Private" scope');
  } else if (videoCounts.length === 0 || Math.max(...(videoCounts.length > 0 ? videoCounts : [0])) === 0) {
    console.log('1. Upload videos to your Vimeo account');
    console.log('2. Make some videos public/embeddable');
    console.log('3. Try removing "embeddable" filter');
  } else {
    console.log('1. API connection looks good!');
    console.log('2. Try import script with --dry-run');
  }
}

// Run diagnostic
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostic().catch(error => {
    console.error('\n💥 Diagnostic failed:', error.message);
    process.exit(1);
  });
}

export { runDiagnostic };
