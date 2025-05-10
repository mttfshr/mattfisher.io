#!/usr/bin/env node
// docs/_scripts/fix-html-in-markdown.mjs
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Paths to search for Markdown files
const docsDir = './docs';
const sections = ['workbook', 'notes'];

// Process files
let totalFixed = 0;

sections.forEach(section => {
  const sectionDir = path.join(docsDir, section);
  
  if (!fs.existsSync(sectionDir)) {
    console.log(`Section directory not found: ${sectionDir}`);
    return;
  }
  
  // Get all markdown files (excluding index.md)
  const files = fs.readdirSync(sectionDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  console.log(`Checking ${files.length} files in ${section}...`);
  
  files.forEach(file => {
    try {
      const filePath = path.join(sectionDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse the file with gray-matter
      const { data: frontmatter, content } = matter(fileContent);
      
      // Check for HTML tags in the content
      const hasHtmlTags = /<[^>]+>/g.test(content);
      
      if (hasHtmlTags) {
        // Create a backup
        fs.writeFileSync(`${filePath}.htmlbak`, fileContent);
        
        // Clean up the content
        let cleanedContent = content;
        
        // Remove HTML styling
        cleanedContent = cleanedContent.replace(/<style[\s\S]*?<\/style>/gi, '');
        
        // Remove HTML divs and spans
        cleanedContent = cleanedContent.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '');
        cleanedContent = cleanedContent.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '');
        
        // Remove any orphaned HTML tags
        cleanedContent = cleanedContent.replace(/<\/[^>]+>/g, '');
        
        // Clean up any extra newlines
        cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
        
        // Write the cleaned content back
        const newFileContent = matter.stringify(cleanedContent, frontmatter);
        fs.writeFileSync(filePath, newFileContent);
        
        console.log(`Fixed HTML in: ${file}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
});

if (totalFixed > 0) {
  console.log(`\nFixed HTML issues in ${totalFixed} files.`);
} else {
  console.log('\nNo HTML issues found in Markdown files.');
}
