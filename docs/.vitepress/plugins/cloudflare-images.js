// VitePress plugin for Cloudflare Images integration
// Handles any remaining NAS URLs during build time

import fs from 'fs/promises';
import path from 'path';

export function cloudflareImagesPlugin() {
  let catalog = { images: {}, videoThumbnails: {} };
  let nasUrlPattern = null;
  
  return {
    name: 'cloudflare-images',
    
    async buildStart() {
      // Build NAS URL pattern from environment
      const nasBaseUrl = process.env.NAS_BASE_URL || 
                        (process.env.NAS_HOSTNAME ? 
                         `http://${process.env.NAS_HOSTNAME}:${process.env.NAS_PORT || '8080'}` : 
                         null);
      
      if (nasBaseUrl) {
        const escapedBaseUrl = nasBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        nasUrlPattern = new RegExp(`${escapedBaseUrl}/([^\\s\\)]+)`, 'g');
      }
      
      // Load the catalog
      try {
        const catalogPath = path.resolve(process.cwd(), 'catalog.json');
        const catalogData = await fs.readFile(catalogPath, 'utf8');
        catalog = JSON.parse(catalogData);
        console.log(`📁 Loaded Cloudflare Images catalog with ${Object.keys(catalog.images).length} images`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('⚠️  Could not load Cloudflare Images catalog:', error.message);
        }
      }
    },
    
    transform(code, id) {
      // Only process markdown files
      if (!id.endsWith('.md') || !nasUrlPattern) {
        return null;
      }
      
      // Check for any remaining NAS URLs
      const matches = [...code.matchAll(nasUrlPattern)];
      
      if (matches.length === 0) {
        return null;
      }
      
      console.warn(`⚠️  Found ${matches.length} unprocessed NAS URLs in ${path.relative(process.cwd(), id)}`);
      console.warn('   Run "npm run upload-media docs/workbook" before building');
      
      // For now, just warn - don't replace URLs without proper upload
      // In the future, we could add fallback behavior here
      
      return null;
    }
  };
}