#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.join(__dirname, 'docs/.vitepress/theme/components');

// Font weight replacements
const fontWeightReplacements = [
  { from: /font-weight:\s*300/g, to: 'font-weight: var(--font-light)' },
  { from: /font-weight:\s*400/g, to: 'font-weight: var(--font-normal)' },
  { from: /font-weight:\s*500/g, to: 'font-weight: var(--font-normal)' },
  { from: /font-weight:\s*600/g, to: 'font-weight: var(--font-normal)' },
  { from: /font-weight:\s*700/g, to: 'font-weight: var(--font-normal)' }
];

// Font size replacements (common hardcoded values)
const fontSizeReplacements = [
  { from: /font-size:\s*0\.75rem/g, to: 'font-size: var(--text-xs)' },
  { from: /font-size:\s*0\.875rem/g, to: 'font-size: var(--text-sm)' },
  { from: /font-size:\s*1rem/g, to: 'font-size: var(--text-base)' },
  { from: /font-size:\s*1\.125rem/g, to: 'font-size: var(--text-lg)' },
  { from: /font-size:\s*1\.25rem/g, to: 'font-size: var(--text-xl)' },
  { from: /font-size:\s*1\.5rem/g, to: 'font-size: var(--text-3xl)' },
  { from: /font-size:\s*12px/g, to: 'font-size: var(--text-xs)' },
  { from: /font-size:\s*14px/g, to: 'font-size: var(--text-sm)' },
  { from: /font-size:\s*16px/g, to: 'font-size: var(--text-base)' },
  { from: /font-size:\s*18px/g, to: 'font-size: var(--text-lg)' },
  { from: /font-size:\s*20px/g, to: 'font-size: var(--text-xl)' },
  { from: /font-size:\s*24px/g, to: 'font-size: var(--text-3xl)' },
  { from: /font-size:\s*10px/g, to: 'font-size: var(--text-xs)' },
  { from: /font-size:\s*48px/g, to: 'font-size: var(--text-5xl)' }
];

// Color replacements (VitePress to design tokens)
const colorReplacements = [
  { from: /var\(--vp-c-text-1\)/g, to: 'var(--text-primary)' },
  { from: /var\(--vp-c-text-2\)/g, to: 'var(--text-secondary)' },
  { from: /var\(--vp-c-text-3\)/g, to: 'var(--text-tertiary)' }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Apply font weight replacements
    for (const replacement of fontWeightReplacements) {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }
    
    // Apply font size replacements
    for (const replacement of fontSizeReplacements) {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }
    
    // Apply color replacements
    for (const replacement of colorReplacements) {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalUpdated = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      totalUpdated += processDirectory(filePath);
    } else if (file.endsWith('.vue')) {
      if (processFile(filePath)) {
        totalUpdated++;
      }
    }
  }
  
  return totalUpdated;
}

console.log('🔧 Fixing hardcoded CSS values in Vue components...\n');

const updatedCount = processDirectory(componentsDir);

console.log(`\n🎉 Completed! Updated ${updatedCount} files.`);
console.log('\n📋 Changes made:');
console.log('   • Font weights 300-700 → design tokens');
console.log('   • Font sizes (px/rem) → design tokens');
console.log('   • VitePress color variables → design tokens');
