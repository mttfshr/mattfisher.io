#!/usr/bin/env node

// Fix Vimeo YAML Structure Script
// Standardizes all workbook video items to use consistent YAML structure

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workbookVideosDir = path.resolve(__dirname, '../docs/workbook/videos');

console.log('🔧 FIXING VIMEO YAML STRUCTURE');
console.log('================================\n');

// Define the correct YAML structure pattern
const CORRECT_STRUCTURE = {
  media: {
    type: 'video',
    provider: 'vimeo', 
    url: 'https://vimeo.com/VIDEO_ID',
    embed: true
  }
};

async function fixVimeoYamlStructure() {
  if (!fs.existsSync(workbookVideosDir)) {
    console.log('❌ Workbook videos directory not found:', workbookVideosDir);
    return;
  }

  const files = fs.readdirSync(workbookVideosDir).filter(file => file.endsWith('.md'));
  console.log(`📁 Found ${files.length} markdown files to check\n`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let errorCount = 0;

  for (const filename of files) {
    const filePath = path.join(workbookVideosDir, filename);
    
    try {
      console.log(`🔍 Checking: ${filename}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        console.log(`   ⚠️  No frontmatter found`);
        continue;
      }

      const frontmatterText = frontmatterMatch[1];
      const restOfContent = content.substring(frontmatterMatch[0].length);
      
      // Parse current YAML
      const currentData = yaml.load(frontmatterText);      
      // Check if this needs fixing
      const needsFix = checkIfNeedsFix(currentData);
      
      if (!needsFix) {
        console.log(`   ✅ Already correct structure`);
        alreadyCorrectCount++;
        continue;
      }

      // Fix the structure
      const fixedData = fixYamlStructure(currentData);
      
      // Generate new YAML
      const newFrontmatter = yaml.dump(fixedData, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      // Reconstruct file
      const newContent = `---\n${newFrontmatter}---${restOfContent}`;
      
      // Write back to file
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      console.log(`   🔧 Fixed YAML structure`);
      fixedCount++;
      
    } catch (error) {
      console.log(`   ❌ Error processing file: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('============');
  console.log(`✅ Already correct: ${alreadyCorrectCount}`);
  console.log(`🔧 Fixed: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Total processed: ${files.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 YAML structure standardization complete!');
    console.log('All workbook video items now use consistent structure.');
  }
}

function checkIfNeedsFix(data) {
  // Check if it has the wrong structure (type at root level)
  if (data.type === 'video' && data.media && !data.media.type) {
    return true;
  }
  
  // Check if media object exists but missing required fields
  if (data.media && data.media.provider === 'vimeo') {
    if (!data.media.type || !data.media.embed) {
      return true;
    }
  }
  
  return false;
}
function fixYamlStructure(data) {
  const fixed = { ...data };
  
  // If type is at root level, move it to media
  if (fixed.type === 'video' && fixed.media) {
    fixed.media.type = 'video';
    delete fixed.type;
  }
  
  // Ensure media object has required fields for Vimeo videos
  if (fixed.media && fixed.media.provider === 'vimeo') {
    // Ensure type is set
    if (!fixed.media.type) {
      fixed.media.type = 'video';
    }
    
    // Ensure embed is set
    if (fixed.media.embed === undefined) {
      fixed.media.embed = true;
    }
  }
  
  return fixed;
}

// Run the fix
fixVimeoYamlStructure().catch(console.error);