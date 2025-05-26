#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unified authentication script for different services
 * Usage: npm run auth <service>
 * Services: spotify, youtube
 */
async function runAuth() {
  const args = process.argv.slice(2);
  const service = args[0];

  if (!service) {
    console.log('Usage: npm run auth <service>');
    console.log('Available services: spotify, youtube');
    return;
  }

  try {
    let authModule;
    
    switch (service.toLowerCase()) {
      case 'spotify':
        authModule = await import('./spotifyAuth.js');
        break;
      case 'youtube':
        authModule = await import('./youtubeAuth.js');
        break;
      default:
        console.error(`Unknown service: ${service}`);
        console.log('Available services: spotify, youtube');
        return;
    }

    // Most auth modules export a default function
    if (authModule.default) {
      await authModule.default();
    } else {
      console.error(`No default export found for ${service} auth module`);
    }
  } catch (error) {
    console.error(`Error running ${service} authentication:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuth().catch(console.error);
}

export default runAuth;
