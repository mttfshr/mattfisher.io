// docs/_scripts/convert-to-enhanced-frontmatter.mjs
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDir = '.';
const sections = ['workbook', 'notes'];

// Process each section
sections.forEach(section => {
  const sectionDir = path.join(docsDir, section);
  
  if (!fs.existsSync(sectionDir)) {
    console.log(`Section directory not found: ${sectionDir}`);
    return;
  }
  
  // Get all markdown files (excluding index.md)
  const files = fs.readdirSync(sectionDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  console.log(`Converting ${files.length} files in ${section}...`);
  
  files.forEach(file => {
    try {
      const filePath = path.join(sectionDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse the file with gray-matter
      const { data: frontmatter, content } = matter(fileContent);
      
      // Extract content parts
      let mainContent = content;
      
      // Look for media links in the content
      const vimeoMatch = content.match(/https?:\/\/(www\.)?vimeo\.com\/(\d+)/i);
      const youtubeMatch = content.match(/https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i) || 
                          content.match(/https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/i);
      const imageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
      
      // Look for tags section
      const tagsMatch = content.match(/(?:Tags|tags):\s*(.*?)(?:\n|$)/i);
      let tags = frontmatter.tags || [];
      
      if (tagsMatch && !frontmatter.tags) {
        tags = tagsMatch[1].split(',').map(tag => tag.trim());
        // Remove tags section from content
        mainContent = mainContent.replace(/(?:Tags|tags):\s*(.*?)(?:\n|$)/i, '');
      }
      
      // Look for technical details section
      const techDetailsMatch = content.match(/(?:## Technical Details|## Tech Specs|## Specifications)[\s\S]*?(?=##|$)/i);
      let techSpecs = [];
      let specs = {};
      
      if (techDetailsMatch) {
        const techDetailsContent = techDetailsMatch[0];
        
        // Extract specific tech details
        const softwareMatch = techDetailsContent.match(/Software:\s*(.*?)(?:<br>|\n|$)/i);
        if (softwareMatch) {
          techSpecs = softwareMatch[1].split(',').map(item => item.trim());
        }
        
        // Extract resolution
        const resolutionMatch = techDetailsContent.match(/Resolution:\s*(.*?)(?:<br>|\n|$)/i);
        if (resolutionMatch) {
          specs.resolution = resolutionMatch[1].trim();
        }
        
        // Extract frame rate
        const frameRateMatch = techDetailsContent.match(/Frame Rate:\s*(.*?)(?:<br>|\n|$)/i);
        if (frameRateMatch) {
          specs.frameRate = frameRateMatch[1].trim();
        }
        
        // Extract duration
        const durationMatch = techDetailsContent.match(/Duration:\s*(.*?)(?:<br>|\n|$)/i);
        if (durationMatch) {
          specs.duration = durationMatch[1].trim();
        }
        
        // Remove tech details section from content
        mainContent = mainContent.replace(/(?:## Technical Details|## Tech Specs|## Specifications)[\s\S]*?(?=##|$)/i, '');
      }
      
      // Create enhanced frontmatter based on section type
      let enhancedFrontmatter = {};
      
      // Common fields
      enhancedFrontmatter.title = frontmatter.title || file.replace(/\.md$/, '').replace(/-/g, ' ');
      enhancedFrontmatter.description = frontmatter.description || '';
      
      // Handle different date fields and layout based on section
      if (section === 'workbook') {
        // For workbook, use date field and workbookItem layout
        enhancedFrontmatter.date = frontmatter.date || null;
        enhancedFrontmatter.layout = 'workbookItem';
      } else if (section === 'notes') {
        // For notes, preserve lastModified and createdAt and use note layout
        if (frontmatter.lastModified) enhancedFrontmatter.lastModified = frontmatter.lastModified;
        if (frontmatter.createdAt) enhancedFrontmatter.createdAt = frontmatter.createdAt;
        enhancedFrontmatter.layout = 'note';
      }
      
      // Only add non-empty tags
      if (tags && tags.length > 0) {
        enhancedFrontmatter.tags = tags;
      }
      
      // Handle cover image (primarily for notes)
      if (frontmatter.coverImage) {
        enhancedFrontmatter.image = frontmatter.coverImage;
      }
      
      // Add media information if found
      if (vimeoMatch) {
        enhancedFrontmatter.media = {
          type: 'video',
          provider: 'vimeo',
          url: vimeoMatch[0],
          embed: true
        };
      } else if (youtubeMatch) {
        enhancedFrontmatter.media = {
          type: 'video',
          provider: 'youtube',
          url: youtubeMatch[0],
          embed: true
        };
      }
      
      // Add image if found and not already set
      if (imageMatch && !enhancedFrontmatter.image && !vimeoMatch && !youtubeMatch) {
        enhancedFrontmatter.image = imageMatch[2];
      }
      
      // Add tech specs if found - only add if there's actual content
      if (techSpecs.length > 0) {
        enhancedFrontmatter.tech = techSpecs;
      }
      
      if (Object.keys(specs).length > 0) {
        enhancedFrontmatter.specs = specs;
      }
      
      // Clean up the content
      // Remove any HTML styling
      mainContent = mainContent.replace(/<style[\s\S]*?<\/style>/gi, '');
      
      // Remove HTML metadata divs and other common HTML tags
      mainContent = mainContent.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '');
      mainContent = mainContent.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '');
      
      // Remove any orphaned HTML tags (like a closing </div> without an opening tag)
      mainContent = mainContent.replace(/<\/[^>]+>/g, '');
      
      // Clean up any extra newlines
      mainContent = mainContent.replace(/\n{3,}/g, '\n\n');
      
      // Create the new file content with enhanced frontmatter
      const newFileContent = matter.stringify(mainContent, enhancedFrontmatter);
      
      // Create a backup of the original file
      fs.writeFileSync(`${filePath}.bak`, fileContent);
      
      // Write the new content
      fs.writeFileSync(filePath, newFileContent);
      
      console.log(`Converted: ${file}`);
    } catch (error) {
      console.error(`Error converting ${file}:`, error.message);
    }
  });
  
  console.log(`Completed conversion for ${section}`);
});

console.log('All sections processed successfully!');