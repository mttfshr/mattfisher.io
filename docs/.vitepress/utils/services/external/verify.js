#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unified verification script for different services
 * Usage: npm run verify <service>
 * Services: spotify, vimeo, youtube, all
 */
async function runVerify() {
  const args = process.argv.slice(2);
  const service = args[0];

  if (!service) {
    console.log('Usage: npm run verify <service>');
    console.log('Available services: spotify, vimeo, youtube, all');
    return;
  }

  const services = service.toLowerCase() === 'all' 
    ? ['spotify', 'vimeo', 'youtube']
    : [service.toLowerCase()];

  for (const svc of services) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 VERIFYING ${svc.toUpperCase()} CONFIGURATION`);
      console.log('='.repeat(50));

      let verifyModule;
      
      switch (svc) {
        case 'spotify':
          verifyModule = await import('./verifySpotifyConfig.js');
          break;
        case 'vimeo':
          verifyModule = await import('./verifyVimeoConfig.js');
          break;
        case 'youtube':
          verifyModule = await import('./verifyYoutubeConfig.js');
          break;
        default:
          console.error(`Unknown service: ${svc}`);
          continue;
      }

      // Most verify modules just run when imported, but check for exports
      if (verifyModule.default) {
        await verifyModule.default();
      }
    } catch (error) {
      console.error(`Error verifying ${svc} configuration:`, error.message);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runVerify().catch(console.error);
}

export default runVerify;
