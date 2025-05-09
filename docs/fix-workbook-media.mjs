#!/usr/bin/env node
// fix-workbook-media.mjs
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const workbookDir = './docs/workbook';

// Manual mapping for video embeds that we know should be there
const mediaMap = {
  'obsidian-heart': {
    type: 'video',
    provider: 'vimeo',
    url: 'https://vimeo.com/684505621',
    embed: true
  },
  'motion-studies': {
    type: 'video', 
    provider: 'vimeo',
    url: 'https://vimeo.com/431247529',
    embed: true
  },
  'sound-viz': {
    type: 'video',
    provider: 'vimeo',
    url: 'https://vimeo.com/824894548',
    embed: true
  },
  'field-recording-urban': {
    type: 'audio',
    url: 'https://example.com/audio/urban-field.mp3',
    embed: true
  }
};

// Get all markdown files (excluding index.md)
const files = fs.readdirSync(workbookDir)
  .filter(file => file.endsWith('.md') && file !== 'index.md');

console.log(`Checking ${files.length} files in workbook...`);
let fixedCount = 0;

files.forEach(file => {
  try {
    const filePath = path.join(workbookDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract slug from filename
    const slug = file.replace(/\.md$/, '');
    
    // Parse the file with gray-matter
    const { data: frontmatter, content } = matter(fileContent);
    
    let needsUpdate = false;
    
    // Check if it's in our media map
    if (mediaMap[slug] && !frontmatter.media) {
      // Create backup if one doesn't exist already
      if (!fs.existsSync(`${filePath}.mediabak`)) {
        fs.writeFileSync(`${filePath}.mediabak`, fileContent);
      }
      
      // Create new frontmatter with media object
      const newFrontmatter = { ...frontmatter };
      
      // Add media object from our map
      newFrontmatter.media = mediaMap[slug];
      
      // Clean up old properties if they exist
      delete newFrontmatter.mediaUrl;
      delete newFrontmatter.mediaType;
      delete newFrontmatter.videoProvider;
      
      // Write updated file
      const newFileContent = matter.stringify(content, newFrontmatter);
      fs.writeFileSync(filePath, newFileContent);
      
      console.log(`Fixed media in: ${file}`);
      fixedCount++;
    }
    // Check if it has mediaUrl but no media object
    else if (frontmatter.mediaUrl && !frontmatter.media) {
      // Create backup
      if (!fs.existsSync(`${filePath}.mediabak`)) {
        fs.writeFileSync(`${filePath}.mediabak`, fileContent);
      }
      
      // Create new frontmatter with media object
      const newFrontmatter = { ...frontmatter };
      
      // Add media object
      newFrontmatter.media = {
        type: frontmatter.mediaType || 'image',
        provider: frontmatter.videoProvider || '',
        url: frontmatter.mediaUrl,
        embed: true
      };
      
      // Clean up old properties
      delete newFrontmatter.mediaUrl;
      delete newFrontmatter.mediaType;
      delete newFrontmatter.videoProvider;
      
      // Write updated file
      const newFileContent = matter.stringify(content, newFrontmatter);
      fs.writeFileSync(filePath, newFileContent);
      
      console.log(`Fixed media in: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

if (fixedCount > 0) {
  console.log(`\nFixed media embeds in ${fixedCount} workbook files.`);
} else {
  console.log('\nNo workbook files needed media fixes.');
}
