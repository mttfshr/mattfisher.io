#!/usr/bin/env node

/**
 * Fix remaining YAML issues in imported Vimeo videos
 */

import fs from 'fs/promises';
import path from 'path';

async function fixRemainingYAMLIssues() {
  const videosDir = 'docs/workbook/videos';
  
  console.log('🔧 Fixing remaining YAML issues...\n');
  
  try {
    const files = await fs.readdir(videosDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    let fixedCount = 0;
    
    for (const file of mdFiles) {
      const filePath = path.join(videosDir, file);
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Check if this file has issues
      if (content.includes('-   \nvimeoId:')) {
        console.log(`📝 Fixing: ${file}`);
        
        // Fix the empty tag and add the missing collection tag
        content = content
          .replace(/  -   \nvimeoId:/g, '  - collection:vimeo-import\nvimeoId:')
          .replace(/  - video\n  - vimeo\n  - video\n  - vimeo\n/g, '  - video\n  - vimeo\n');
        
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`   ✅ Fixed YAML issues in ${file}`);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary: Fixed ${fixedCount} files`);
    return fixedCount;
    
  } catch (error) {
    console.error('❌ Error fixing YAML:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRemainingYAMLIssues().catch(error => {
    console.error('\n💥 Fix failed:', error.message);
    process.exit(1);
  });
}
