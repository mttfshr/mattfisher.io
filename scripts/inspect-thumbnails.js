#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Quick Thumbnail Cache Inspector
 * Shows what thumbnails you've cached so far
 */

async function inspectThumbnailCache() {
  try {
    console.log('🔍 Thumbnail Cache Inspector');
    console.log('============================');
    
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-images-cache.json');
    const cacheContent = await fs.readFile(cachePath, 'utf8');
    const cache = JSON.parse(cacheContent);
    
    const entries = Object.values(cache);
    console.log(`📊 Total cached thumbnails: ${entries.length}`);
    
    // Group by domain
    const byDomain = {};
    entries.forEach(entry => {
      try {
        const domain = new URL(entry.sourceUrl).hostname.replace('www.', '');
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      } catch (error) {
        byDomain['unknown'] = (byDomain['unknown'] || 0) + 1;
      }
    });
    
    console.log('\n📊 Thumbnails by domain:');
    Object.entries(byDomain)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // Top 20
      .forEach(([domain, count]) => {
        console.log(`   ${domain}: ${count} thumbnails`);
      });
    
    // Show some recent examples
    const recent = entries
      .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))
      .slice(0, 10);
    
    console.log('\n🆕 Recently cached (last 10):');
    recent.forEach((entry, i) => {
      const domain = new URL(entry.sourceUrl).hostname;
      const title = entry.title?.substring(0, 50) || 'No title';
      console.log(`   ${i + 1}. ${domain} - ${title}${entry.title?.length > 50 ? '...' : ''}`);
    });
    
    // Show image URLs for first few as examples
    console.log('\n🖼️  Sample thumbnail URLs:');
    entries.slice(0, 5).forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.imageUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error inspecting cache:', error.message);
  }
}

inspectThumbnailCache();