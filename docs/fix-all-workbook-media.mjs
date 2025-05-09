#!/usr/bin/env node
// fix-all-workbook-media.mjs
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const workbookDir = './docs/workbook';

// Manual mapping for all workbook files - providing default values based on the filenames
// This ensures all entries have consistent media
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
  },
  'generative-art-1': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'light-study-4': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'maybe-later-maybe-next-time': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'penrose-tiling': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'sabines-search-for-quantum-gravity': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'smoking-frog': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'spearthrowerowl': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'the-place-where-gods-are-born': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  },
  'this-is-where-we-say-goodbye': {
    type: 'image',
    url: '/_media/generic-placeholder.svg',
    embed: true
  }
};

// Get all markdown files (excluding index.md)
const files = fs.readdirSync(workbookDir)
  .filter(file => file.endsWith('.md') && file !== 'index.md');

console.log(`Processing ${files.length} files in workbook...`);
let fixedCount = 0;

files.forEach(file => {
  try {
    const filePath = path.join(workbookDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract slug from filename
    const slug = file.replace(/\.md$/, '');
    
    // Parse the file with gray-matter
    const { data: frontmatter, content } = matter(fileContent);
    
    // Always update the file to ensure consistency
    // Create backup if one doesn't exist already
    if (!fs.existsSync(`${filePath}.mediabak`)) {
      fs.writeFileSync(`${filePath}.mediabak`, fileContent);
    }
    
    // Create new frontmatter with media object
    const newFrontmatter = { ...frontmatter };
    
    // If it's in our media map, update using that data
    if (mediaMap[slug]) {
      newFrontmatter.media = mediaMap[slug];
    } 
    // Otherwise, provide a default image
    else {
      newFrontmatter.media = {
        type: 'image',
        url: '/_media/generic-placeholder.svg',
        embed: true
      };
    }
    
    // Clean up old properties if they exist
    delete newFrontmatter.mediaUrl;
    delete newFrontmatter.mediaType;
    delete newFrontmatter.videoProvider;
    
    // Ensure layout is set
    newFrontmatter.layout = 'workbookItem';
    
    // Ensure date is in correct format (if exists)
    if (newFrontmatter.date && typeof newFrontmatter.date === 'string' && newFrontmatter.date.includes('T')) {
      // Convert ISO date to YYYY-MM-DD
      newFrontmatter.date = newFrontmatter.date.split('T')[0];
    }
    
    // Write updated file
    const newFileContent = matter.stringify(content, newFrontmatter);
    fs.writeFileSync(filePath, newFileContent);
    
    console.log(`Updated: ${file}`);
    fixedCount++;
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nUpdated ${fixedCount} workbook files with correct media embeds.`);
