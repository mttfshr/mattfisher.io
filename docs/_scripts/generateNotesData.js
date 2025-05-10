// docs/_scripts/generateNotesData.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

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
 * Process a single note file
 * @param {string} filePath - Path to the note markdown file
 * @param {string} fileName - Name of the file
 * @returns {Object|null} - Processed note or null if invalid
 */
function processNoteFile(filePath, fileName) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter
    const { data: frontmatter } = matter(content);
    
    // Skip if not a proper note with required fields
    if (!frontmatter.title) {
      console.warn(`Skipping ${fileName}: Missing title in frontmatter`);
      return null;
    }
    
    // Generate slug from filename if not provided
    const slug = frontmatter.slug || generateSlug(fileName);
    
    // Create note item
    return {
      title: frontmatter.title,
      slug: slug,
      description: frontmatter.description || '',
      lastModified: frontmatter.lastModified || null,
      createdAt: frontmatter.createdAt || null,
      tags: frontmatter.tags || [],
      coverImage: frontmatter.coverImage || ''
    };
  } catch (error) {
    console.error(`Error processing note file ${fileName}:`, error);
    return null;
  }
}

/**
 * Generate notes data by reading all markdown files in the notes directory
 */
export function generateNotesData() {
  const notesDir = path.join(__dirname, '../notes');
  const outputFile = path.join(__dirname, '../.vitepress/data/notesData.js');
  
  console.log('Reading note files from', notesDir);
  
  // Read all markdown files in the notes directory
  const files = fs.readdirSync(notesDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  console.log(`Found ${files.length} note files`);
  
  // Process each file
  const items = [];
  
  for (const file of files) {
    const filePath = path.join(notesDir, file);
    const item = processNoteFile(filePath, file);
    
    if (item) {
      items.push(item);
    }
  }
  
  // Sort items by last modified date (newest first)
  items.sort((a, b) => {
    const dateA = a.lastModified ? new Date(a.lastModified) : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.lastModified ? new Date(b.lastModified) : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });
  
  // Write to output file
  const outputContent = `// Auto-generated notes data
export const notesData = ${JSON.stringify(items, null, 2)};
`;
  
  // Ensure directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, outputContent);
  console.log(`Generated notes data with ${items.length} items`);
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNotesData();
}
