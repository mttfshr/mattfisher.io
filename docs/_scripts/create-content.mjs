#!/usr/bin/env node
// docs/_scripts/create-content.mjs
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory where the script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to create a slug from a title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Remove consecutive hyphens
}

// Create content file
async function createContent() {
  try {
    console.log('📝 Create New Content');
    console.log('====================');
    
    // Get content type
    const section = await askQuestion('Section (workbook/notes): ');
    if (!['workbook', 'notes'].includes(section)) {
      console.error('Invalid section. Please choose "workbook" or "notes".');
      rl.close();
      return;
    }
    
    // Get title
    const title = await askQuestion('Title: ');
    if (!title) {
      console.error('Title is required.');
      rl.close();
      return;
    }
    
    // Generate slug
    const slug = createSlug(title);
    
    // Get description
    const description = await askQuestion('Description: ');
    
    // Get date(s) based on section
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let frontmatter = `---
title: ${title}`;

    if (description) {
      frontmatter += `
description: ${description}`;
    }
    
    if (section === 'workbook') {
      // For workbook entries
      const date = await askQuestion(`Date (YYYY-MM-DD) [${currentDate}]: `) || currentDate;
      frontmatter += `
date: ${date}`;
    } else {
      // For notes
      const createdAt = await askQuestion(`Created date (YYYY-MM-DD) [${currentDate}]: `) || currentDate;
      const lastModified = await askQuestion(`Last modified date (YYYY-MM-DD) [${currentDate}]: `) || currentDate;
      
      frontmatter += `
createdAt: ${createdAt}
lastModified: ${lastModified}`;
    }
    
    // Get tags
    const tagsInput = await askQuestion('Tags (comma-separated): ');
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    
    if (tags.length > 0) {
      frontmatter += `
tags: [${tags.join(', ')}]`;
    }
    
    // Section-specific fields
    if (section === 'workbook') {
      // Get media type for workbook
      const mediaTypeInput = await askQuestion('Media type (video/image/audio/gallery): ');
      
      if (mediaTypeInput) {
        const mediaType = mediaTypeInput.toLowerCase();
        
        if (mediaType === 'video') {
          const videoUrl = await askQuestion('Video URL: ');
          const isVimeo = videoUrl.includes('vimeo.com');
          const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
          
          const provider = isVimeo ? 'vimeo' : (isYouTube ? 'youtube' : '');
          
          frontmatter += `
media:
  type: video
  provider: ${provider}
  url: ${videoUrl}
  embed: true`;
        } else if (mediaType === 'image') {
          const imageUrl = await askQuestion('Image URL: ');
          frontmatter += `
image: ${imageUrl}`;
        }
      }
      
      // Get technical details
      const hasTechDetails = (await askQuestion('Add technical details? (y/n): ')).toLowerCase() === 'y';
      
      if (hasTechDetails) {
        const techInput = await askQuestion('Technologies (comma-separated): ');
        const tech = techInput ? techInput.split(',').map(t => t.trim()) : [];
        
        const resolution = await askQuestion('Resolution: ');
        const frameRate = await askQuestion('Frame Rate: ');
        const duration = await askQuestion('Duration: ');
        
        if (tech.length > 0) {
          frontmatter += `
tech:
${tech.map(t => `  - ${t}`).join('\n')}`;
        }
        
        if (resolution || frameRate || duration) {
          frontmatter += `
specs:`;
          if (resolution) frontmatter += `
  resolution: ${resolution}`;
          if (frameRate) frontmatter += `
  frameRate: ${frameRate}`;
          if (duration) frontmatter += `
  duration: ${duration}`;
        }
      }
      
      // Add layout
      frontmatter += `
layout: workbookItem`;
    } else {
      // Notes-specific fields
      const imageUrl = await askQuestion('Featured image URL (optional): ');
      if (imageUrl) {
        frontmatter += `
image: ${imageUrl}`;
      }
      
      // Add layout
      frontmatter += `
layout: note`;
    }
    
    frontmatter += `
---

# ${title}

// Add your content here...
`;
    
    // Create file
    const filePath = path.join(__dirname, '..', section, `${slug}.md`);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      const overwrite = await askQuestion('File already exists. Overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, frontmatter);
    
    console.log(`\nContent file created: ${filePath}`);
    console.log(`\nSlug: ${slug}`);
    
  } catch (error) {
    console.error('Error creating content:', error);
  } finally {
    rl.close();
  }
}

// Run the script
createContent();