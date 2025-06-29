#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Pinterest Thumbnail Extractor
 * 
 * Extracts Pinterest's own thumbnails from the Pinterest export file
 * Maps canonical URLs to Pinterest image IDs for much better thumbnails
 */

/**
 * Parse Pinterest export HTML to extract pin data
 */
async function parsePinterestExport() {
  console.log('🎨 Pinterest Thumbnail Extractor');
  console.log('===============================');
  
  try {
    // Read the Pinterest export file
    const exportPath = 'project/reference/Receive Items.html';
    const html = await fs.readFile(exportPath, 'utf8');
    
    console.log('📁 Loaded Pinterest export file');
    
    // Find the pins section (starts with <h1 id=db1sy>Pins</h1>)
    const pinsSection = html.substring(html.indexOf('<h1 id=db1sy>Pins</h1>'));
    
    // Split into individual pin entries
    const pinEntries = pinsSection.split(/(?=<a href="https:\/\/www\.pinterest\.com\/pin\/)/);
    
    console.log(`📌 Found ${pinEntries.length} pin entries`);
    
    const pinMappings = [];
    let processed = 0;
    let withCanonicalLink = 0;
    let withImage = 0;
    
    for (const entry of pinEntries) {
      if (!entry.includes('pinterest.com/pin/')) continue;
      
      processed++;
      
      // Extract Pinterest pin URL
      const pinUrlMatch = entry.match(/href="(https:\/\/www\.pinterest\.com\/pin\/[^"]+)"/);
      if (!pinUrlMatch) continue;
      
      const pinUrl = pinUrlMatch[1];
      
      // Extract canonical link (destination URL)
      const canonicalMatch = entry.match(/Canonical Link: <a href="([^"]+)">/);
      
      // Extract Pinterest image ID
      const imageMatch = entry.match(/Image: ([a-f0-9]+),/);
      
      // Extract title
      const titleMatch = entry.match(/Title: ([^,]+),/);
      
      // Extract board name
      const boardMatch = entry.match(/Board Name: ([^,]+),/);
      
      if (canonicalMatch && imageMatch) {
        const canonicalUrl = canonicalMatch[1];
        const imageId = imageMatch[1];
        const title = titleMatch ? titleMatch[1].trim() : 'No title';
        const boardName = boardMatch ? boardMatch[1].trim() : 'Unknown board';
        
        // Pinterest image URLs follow this pattern
        const pinterestImageUrl = `https://i.pinimg.com/736x/${imageId}.jpg`;
        
        pinMappings.push({
          pinUrl,
          canonicalUrl,
          imageId,
          pinterestImageUrl,
          title,
          boardName
        });
        
        withCanonicalLink++;
        withImage++;
      }
    }
    
    console.log('\\n📊 Extraction Results:');
    console.log('=======================');
    console.log(`Total processed: ${processed}`);
    console.log(`With canonical links: ${withCanonicalLink}`);
    console.log(`With Pinterest images: ${withImage}`);
    console.log(`Success rate: ${Math.round((withImage / processed) * 100)}%`);
    
    // Sample the results
    console.log('\\n🎨 Sample Pinterest thumbnail mappings:');
    pinMappings.slice(0, 5).forEach((pin, i) => {
      console.log(`${i + 1}. ${pin.title.substring(0, 50)}`);
      console.log(`   Canonical: ${pin.canonicalUrl.substring(0, 60)}...`);
      console.log(`   Pinterest: ${pin.pinterestImageUrl}`);
      console.log(`   Board: ${pin.boardName}`);
      console.log('');
    });
    
    // Check overlap with our current Pinterest pins
    const currentPinsContent = await fs.readFile('docs/pins/pinterest-pins.md', 'utf8');
    const currentUrls = (currentPinsContent.match(/\(https?:\/\/[^)]+\)/g) || [])
      .map(match => match.slice(1, -1));
    
    const matched = pinMappings.filter(pin => 
      currentUrls.includes(pin.canonicalUrl)
    );
    
    console.log(`\\n🔗 Mapping to Current Pinterest Pins:`);
    console.log(`Pins in export: ${pinMappings.length}`);
    console.log(`URLs in current pins: ${currentUrls.length}`);
    console.log(`Matched URLs: ${matched.length}`);
    console.log(`Potential thumbnail coverage: ${Math.round((matched.length / currentUrls.length) * 100)}%`);
    
    // Save the mappings for integration
    const mappingsFile = 'pinterest-thumbnail-mappings.json';
    await fs.writeFile(mappingsFile, JSON.stringify({
      mappings: pinMappings,
      stats: {
        totalPins: pinMappings.length,
        extractedAt: new Date().toISOString(),
        matchedUrls: matched.length,
        currentPins: currentUrls.length
      }
    }, null, 2));
    
    console.log(`\\n💾 Saved ${pinMappings.length} mappings to ${mappingsFile}`);
    
    return pinMappings;
    
  } catch (error) {
    console.error('❌ Error parsing Pinterest export:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  parsePinterestExport();
}

export { parsePinterestExport };
