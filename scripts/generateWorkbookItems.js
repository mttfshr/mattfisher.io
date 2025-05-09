// scripts/generateWorkbookItems.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a slug from a filename
 * @param {string} filename - The filename to convert to a slug
 * @returns {string} - The generated slug
 */
function generateSlug(filename) {
  return filename
    .replace(/\.md$/, '') // Remove .md extension
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * Process a single workbook file
 * @param {string} filePath - Path to the workbook markdown file
 * @param {string} fileName - Name of the file
 * @returns {Object|null} - Processed workbook item or null if invalid
 */
function processWorkbookFile(filePath, fileName) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter
    const { data: frontmatter, content: bodyContent } = matter(content);
    
    // Skip if not a proper workbook item with required fields
    if (!frontmatter.title) {
      console.warn(`Skipping ${fileName}: Missing title in frontmatter`);
      return null;
    }
    
    // Generate slug from filename if not provided
    const slug = frontmatter.slug || generateSlug(fileName);
    
    // Create workbook item
    return {
      title: frontmatter.title,
      slug: slug,
      description: frontmatter.description || '',
      date: frontmatter.date || null,
      mediaType: frontmatter.mediaType || 'image',
      mediaUrl: frontmatter.mediaUrl || '/_media/generic-placeholder.svg',
      thumbnailUrl: frontmatter.thumbnailUrl || '',
      videoProvider: frontmatter.videoProvider || '',
      tags: frontmatter.tags || []
    };
  } catch (error) {
    console.error(`Error processing workbook file ${fileName}:`, error);
    return null;
  }
}

/**
 * Generate workbook data by reading all markdown files in the workbook directory
 */
export function generateWorkbookData() {
  const workbookDir = path.join(__dirname, '../docs/workbook');
  const outputFile = path.join(__dirname, '../docs/.vitepress/data/workbookItems.js');
  
  console.log('Reading workbook files from', workbookDir);
  
  // Read all markdown files in the workbook directory
  const files = fs.readdirSync(workbookDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  console.log(`Found ${files.length} workbook files`);
  
  // Process each file
  const items = [];
  
  for (const file of files) {
    const filePath = path.join(workbookDir, file);
    const item = processWorkbookFile(filePath, file);
    
    if (item) {
      items.push(item);
    }
  }
  
  // Sort items by date (newest first)
  items.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  // Write to output file
  const outputContent = `// Auto-generated workbook items
export const workbookItems = ${JSON.stringify(items, null, 2)};
`;
  
  // Ensure directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, outputContent);
  console.log(`Generated workbook data with ${items.length} items`);
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateWorkbookData();
}
