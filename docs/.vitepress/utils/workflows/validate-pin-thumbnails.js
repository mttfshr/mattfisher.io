// docs/.vitepress/utils/workflows/validate-pin-thumbnails.js
import { getPins } from '../services/content/pins.js';
import fetch from 'node-fetch';

/**
 * Validate thumbnail availability and provide detailed diagnostics
 */
export async function validatePinThumbnails() {
  console.log('🔍 Validating pin thumbnails...\n');
  
  const pinsData = getPins();
  const issues = {
    missingThumbnails: [],
    brokenImages: [],
    fallbacksUsed: [],
    success: []
  };
  
  let totalPins = 0;
  let validatedCount = 0;
  
  for (const pin of pinsData.pins) {
    totalPins++;
    
    console.log(`Checking ${pin.url}...`);
    
    // Check if pin has any image
    if (!pin.imageUrl) {
      issues.missingThumbnails.push({
        url: pin.url,
        title: pin.title,
        contentType: pin.contentType,
        reason: 'No imageUrl in data'
      });
      continue;
    }
    
    // Test if image URL is accessible
    try {
      const response = await fetch(pin.imageUrl, { method: 'HEAD', timeout: 5000 });
      
      if (response.ok) {
        // Determine if this is OpenGraph or Cloudflare fallback
        if (pin.imageUrl.includes('cloudflare')) {
          issues.fallbacksUsed.push({
            url: pin.url,
            title: pin.title,
            imageUrl: pin.imageUrl,
            type: 'cloudflare-video-thumbnail'
          });
        } else {
          issues.success.push({
            url: pin.url,
            title: pin.title,
            imageUrl: pin.imageUrl,
            type: 'opengraph'
          });
        }
      } else {
        issues.brokenImages.push({
          url: pin.url,
          title: pin.title,
          imageUrl: pin.imageUrl,
          status: response.status
        });
      }
    } catch (error) {
      issues.brokenImages.push({
        url: pin.url,
        title: pin.title,
        imageUrl: pin.imageUrl,
        error: error.message
      });
    }
    
    validatedCount++;
    
    // Rate limiting
    if (validatedCount % 10 === 0) {
      console.log(`Validated ${validatedCount}/${totalPins} pins...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate report
  console.log('\n📊 THUMBNAIL VALIDATION REPORT');
  console.log('=====================================');
  console.log(`Total pins: ${totalPins}`);
  console.log(`✅ Working OpenGraph: ${issues.success.length}`);
  console.log(`🔄 Using Cloudflare fallback: ${issues.fallbacksUsed.length}`);
  console.log(`❌ Missing thumbnails: ${issues.missingThumbnails.length}`);
  console.log(`🚫 Broken images: ${issues.brokenImages.length}`);
  
  if (issues.missingThumbnails.length > 0) {
    console.log('\n❌ MISSING THUMBNAILS:');
    issues.missingThumbnails.forEach(issue => {
      console.log(`  • ${issue.url} (${issue.contentType}) - ${issue.reason}`);
    });
  }
  
  if (issues.brokenImages.length > 0) {
    console.log('\n🚫 BROKEN IMAGES:');
    issues.brokenImages.forEach(issue => {
      console.log(`  • ${issue.url} - ${issue.error || issue.status}`);
    });
  }
  
  // Suggestions
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (issues.missingThumbnails.length > 0) {
    const videoUrls = issues.missingThumbnails.filter(i => 
      i.contentType === 'video' || i.url.includes('youtube') || i.url.includes('vimeo')
    );
    
    if (videoUrls.length > 0) {
      console.log(`  📹 ${videoUrls.length} video URLs need Cloudflare thumbnails generated`);
      console.log('     Run: npm run media:generate-video-thumbnails');
    }
    
    const nonVideoUrls = issues.missingThumbnails.filter(i => 
      i.contentType !== 'video' && !i.url.includes('youtube') && !i.url.includes('vimeo')
    );
    
    if (nonVideoUrls.length > 0) {
      console.log(`  🔄 ${nonVideoUrls.length} URLs need OpenGraph data refresh`);
      console.log('     Run: npm run pins:refresh-og-data');
    }
  }
  
  return issues;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePinThumbnails().catch(console.error);
}