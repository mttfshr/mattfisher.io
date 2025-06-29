#!/usr/bin/env node

import fetch from 'node-fetch';

// Test OpenGraph fetching on a few Pinterest URLs
const testUrls = [
  'https://www.flickr.com/photos/lingm07/4967314442',
  'http://mikegoodlett.tumblr.com/post/126831581296/hydrostone-plaster-cast-fabric-mold',
  'https://keespopinga.blogspot.com/2010/10/botanica-fantastica.html'
];

async function testOpenGraph(url) {
  console.log(`\n🧪 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract OpenGraph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    
    console.log(`   ✅ Success!`);
    console.log(`   📷 Image: ${ogImageMatch ? ogImageMatch[1].substring(0, 60) + '...' : 'None found'}`);
    console.log(`   📝 Title: ${ogTitleMatch ? ogTitleMatch[1].substring(0, 60) + '...' : 'None found'}`);
    
    return {
      success: true,
      hasImage: !!ogImageMatch,
      imageUrl: ogImageMatch ? ogImageMatch[1] : null,
      title: ogTitleMatch ? ogTitleMatch[1] : null
    };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Pinterest OpenGraph Test Suite');
  console.log('==================================');
  
  let successful = 0;
  let withImages = 0;
  
  for (const url of testUrls) {
    const result = await testOpenGraph(url);
    
    if (result.success) {
      successful++;
      if (result.hasImage) {
        withImages++;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Successful: ${successful}/${testUrls.length}`);
  console.log(`   🖼️ With images: ${withImages}/${testUrls.length}`);
  console.log(`   📈 Image success rate: ${Math.round(withImages/testUrls.length*100)}%`);
  
  if (withImages > 0) {
    console.log(`\n🎉 OpenGraph fetching works! Ready for full Pinterest processing.`);
  } else {
    console.log(`\n⚠️ No images found in test sample. May need to adjust approach.`);
  }
}

runTests().catch(console.error);
