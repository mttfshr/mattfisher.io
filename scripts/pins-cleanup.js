#!/usr/bin/env node

import { getPins } from '../docs/.vitepress/utils/services/content/pins.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Pins Cleanup Tool - Review pins without thumbnails
 * 
 * Helps you review and clean up pins that don't have thumbnails
 * so you can decide which ones to keep vs remove.
 */

/**
 * Extract URLs from all pin formats
 */
function extractUrlFromPin(pin) {
  if (pin.url) return pin.url;
  if (pin.content && pin.content.includes('http')) {
    const linkMatch = pin.content.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) return linkMatch[2];
    const urlMatch = pin.content.match(/https?:\/\/[^\s)]+/);
    if (urlMatch) return urlMatch[0];
  }
  return null;
}

/**
 * Test if URL is still accessible
 */
async function testUrlAccessibility(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      return { accessible: true, status: response.status };
    } else {
      return { accessible: false, status: response.status, reason: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { accessible: false, status: null, reason: error.message };
  }
}

/**
 * Categorize pins by platform/domain
 */
function categorizePins(pins) {
  const categories = {};
  
  pins.forEach(pin => {
    const url = extractUrlFromPin(pin);
    if (!url) {
      if (!categories['no-url']) categories['no-url'] = [];
      categories['no-url'].push(pin);
      return;
    }
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      if (!categories[domain]) categories[domain] = [];
      categories[domain].push({ ...pin, extractedUrl: url });
    } catch (error) {
      if (!categories['invalid-url']) categories['invalid-url'] = [];
      categories['invalid-url'].push(pin);
    }
  });
  
  return categories;
}

/**
 * Generate cleanup report
 */
async function generateCleanupReport(options = {}) {
  const { testUrls = false, maxUrlTests = 20 } = options;
  
  console.log('🧹 Pins Cleanup Tool - Review pins without thumbnails');
  console.log('=====================================================');
  
  try {
    // Load pins data
    const pinsData = getPins();
    const allPins = pinsData.pins;
    
    // Filter to pins without thumbnails
    const pinsWithoutThumbnails = allPins.filter(pin => 
      !pin.imageUrl || pin.imageUrl.trim() === ''
    );
    
    console.log(`📊 Total pins: ${allPins.length}`);
    console.log(`📊 Pins without thumbnails: ${pinsWithoutThumbnails.length} (${((pinsWithoutThumbnails.length/allPins.length)*100).toFixed(1)}%)`);
    
    if (pinsWithoutThumbnails.length === 0) {
      console.log('✅ All pins have thumbnails!');
      return;
    }
    
    // Categorize by domain
    const categories = categorizePins(pinsWithoutThumbnails);
    
    console.log(`\\n📊 Pins without thumbnails by domain:`);
    console.log('=====================================');
    
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b.length - a.length);
    
    let reportData = {
      totalPins: allPins.length,
      pinsWithoutThumbnails: pinsWithoutThumbnails.length,
      categories: {},
      suggestions: []
    };
    
    for (const [domain, pins] of sortedCategories) {
      console.log(`\\n🔗 ${domain}: ${pins.length} pins`);
      
      const categoryData = {
        count: pins.length,
        pins: [],
        suggestion: ''
      };
      
      // Show sample pins and provide suggestions
      const samplePins = pins.slice(0, 5);
      
      for (const pin of samplePins) {
        const url = pin.extractedUrl || 'No URL';
        const title = pin.title || pin.content?.substring(0, 60) || 'No title';
        const fileName = pin.fileName || 'unknown';
        
        console.log(`   📌 ${title}${title.length > 60 ? '...' : ''}`);
        console.log(`      📁 ${fileName}`);
        console.log(`      🔗 ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        
        let accessibility = null;
        if (testUrls && pin.extractedUrl && categoryData.pins.length < maxUrlTests) {
          console.log(`      🔍 Testing accessibility...`);
          accessibility = await testUrlAccessibility(pin.extractedUrl);
          if (accessibility.accessible) {
            console.log(`      ✅ Accessible (${accessibility.status})`);
          } else {
            console.log(`      ❌ Not accessible: ${accessibility.reason}`);
          }
        }
        
        categoryData.pins.push({
          title,
          url,
          fileName,
          accessibility
        });
        
        console.log('');
      }
      
      if (pins.length > 5) {
        console.log(`   ... and ${pins.length - 5} more pins`);
        console.log('');
      }
      
      // Provide cleanup suggestions based on domain
      let suggestion = '';
      if (domain === 'pinterest.com') {
        suggestion = '🤔 Consider: Pinterest pins often lack thumbnails due to authentication. Review if these boards are still valuable.';
      } else if (domain === 'instagram.com') {
        suggestion = '🤔 Consider: Instagram posts require login. These might be outdated or private.';
      } else if (domain === 'tumblr.com') {
        suggestion = '🤔 Consider: Many Tumblr blogs have changed or been deleted. Test accessibility.';
      } else if (domain.includes('blogspot.com') || domain.includes('wordpress.com')) {
        suggestion = '🤔 Consider: Blog posts might be deleted or moved. Test accessibility.';
      } else if (domain === 'no-url' || domain === 'invalid-url') {
        suggestion = '🗑️  Recommend: These pins have no valid URLs and should probably be removed.';
      } else if (pins.length > 50) {
        suggestion = '🤔 Consider: Large number of pins from this domain. Might be worth bulk testing or reviewing.';
      } else {
        suggestion = '🤔 Consider: Review individual pins to see if content is still valuable.';
      }
      
      categoryData.suggestion = suggestion;
      console.log(`   ${suggestion}`);
      
      reportData.categories[domain] = categoryData;
    }
    
    // Generate summary recommendations
    console.log('\\n🎯 Cleanup Recommendations:');
    console.log('=============================');
    
    const totalProblematicPins = (categories['no-url']?.length || 0) + 
                                 (categories['invalid-url']?.length || 0);
    
    if (totalProblematicPins > 0) {
      console.log(`🗑️  Remove ${totalProblematicPins} pins with no/invalid URLs`);
      reportData.suggestions.push(`Remove ${totalProblematicPins} pins with no/invalid URLs`);
    }
    
    const pinterestPins = categories['pinterest.com']?.length || 0;
    if (pinterestPins > 20) {
      console.log(`🤔 Review ${pinterestPins} Pinterest pins - consider keeping only high-value boards`);
      reportData.suggestions.push(`Review ${pinterestPins} Pinterest pins`);
    }
    
    const instagramPins = categories['instagram.com']?.length || 0;
    if (instagramPins > 0) {
      console.log(`🤔 Review ${instagramPins} Instagram pins - likely outdated due to auth requirements`);
      reportData.suggestions.push(`Review ${instagramPins} Instagram pins`);
    }
    
    console.log(`\\n📋 Next steps:`);
    console.log(`1. Review the domains with most pins first`);
    console.log(`2. Test accessibility for suspicious domains`);
    console.log(`3. Consider removing pins with no URLs or broken links`);
    console.log(`4. Keep pins that provide value even without thumbnails`);
    
    // Save detailed report
    const reportPath = path.resolve(process.cwd(), 'pins-cleanup-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\\n💾 Detailed report saved to: pins-cleanup-report.json`);
    
    console.log(`\\n🔧 Tools available:`);
    console.log(`   node scripts/pins-cleanup.js --test-urls  # Test URL accessibility`);
    console.log(`   node scripts/pins-cleanup.js --domain pinterest.com  # Focus on specific domain`);
    
  } catch (error) {
    console.error('❌ Error generating cleanup report:', error);
  }
}

/**
 * Focus on specific domain
 */
async function reviewDomain(domain) {
  console.log(`🔍 Reviewing pins from: ${domain}`);
  console.log('================================');
  
  const pinsData = getPins();
  const pinsWithoutThumbnails = pinsData.pins.filter(pin => 
    !pin.imageUrl || pin.imageUrl.trim() === ''
  );
  
  const domainPins = pinsWithoutThumbnails.filter(pin => {
    const url = extractUrlFromPin(pin);
    if (!url) return false;
    try {
      return new URL(url).hostname.replace('www.', '') === domain;
    } catch (error) {
      return false;
    }
  });
  
  console.log(`Found ${domainPins.length} pins from ${domain} without thumbnails:\\n`);
  
  for (let i = 0; i < domainPins.length; i++) {
    const pin = domainPins[i];
    const url = extractUrlFromPin(pin);
    const title = pin.title || pin.content?.substring(0, 80) || 'No title';
    
    console.log(`${i + 1}. ${title}${title.length > 80 ? '...' : ''}`);
    console.log(`   📁 File: ${pin.fileName}`);
    console.log(`   🔗 URL: ${url}`);
    
    // Test accessibility
    const accessibility = await testUrlAccessibility(url);
    if (accessibility.accessible) {
      console.log(`   ✅ Accessible (${accessibility.status})`);
    } else {
      console.log(`   ❌ Not accessible: ${accessibility.reason}`);
    }
    
    console.log('');
  }
}

// CLI interface
const args = process.argv.slice(2);
const testUrls = args.includes('--test-urls');
const domainIndex = args.indexOf('--domain');
const targetDomain = domainIndex !== -1 ? args[domainIndex + 1] : null;

if (targetDomain) {
  reviewDomain(targetDomain).catch(console.error);
} else {
  generateCleanupReport({ testUrls, maxUrlTests: 20 }).catch(console.error);
}