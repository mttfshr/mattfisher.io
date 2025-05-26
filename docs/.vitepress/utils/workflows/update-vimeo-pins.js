#!/usr/bin/env node

// A simple script to update just the Vimeo pins and regenerate the OG cache for them
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

// Get project root path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../../');

console.log('==================================================');
console.log('  VIMEO PINS UPDATE AND REFRESH SCRIPT');
console.log('==================================================');
console.log('This script will:');
console.log('1. Update the Vimeo pins from your Vimeo likes');
console.log('2. Force refresh the OG cache for the Vimeo pins');
console.log('3. Generate thumbnails for Vimeo videos (Cloudflare Images)');
console.log('4. Ensure the cache is available in production');
console.log('==================================================');

// Helper function to run a command and log its output
async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Step 1: Update Vimeo pins
    console.log('\n>> STEP 1: Updating Vimeo pins');
    await runCommand('npm', ['run', 'update-pins:vimeo']);
    
    // Step 2: Force refresh OG cache for Vimeo
    console.log('\n>> STEP 2: Regenerating OG cache for Vimeo pins');
    // This is a direct implementation instead of using the npm script
    // to ensure we're passing the parameters correctly
    const ogCacheScript = path.join(projectRoot, 'docs/.vitepress/utils/services/cache/opengraph.js');
    await runCommand('node', [ogCacheScript, '--force', '--target', 'vimeo.md']);
    
    // Step 3: Generate thumbnails for Vimeo pins using unified processor
    console.log('\n>> STEP 3: Generating thumbnails for Vimeo videos (Cloudflare Images)');
    await runCommand('npm', ['run', 'update-vimeo-thumbnails']);
    
    // Step 4: Ensure cache is available in production
    console.log('\n>> STEP 4: Ensuring cache is available in production');
    await runCommand('npm', ['run', 'ensure-cache']);
    
    console.log('\n==================================================');
    console.log('  VIMEO PINS UPDATE COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('✅ Vimeo pins updated');
    console.log('✅ OG cache refreshed');
    console.log('✅ Video thumbnails processed (Cloudflare Images)');
    console.log('✅ Production cache ensured');
  } catch (error) {
    console.error('\nERROR:', error.message);
    process.exit(1);
  }
}

main();
