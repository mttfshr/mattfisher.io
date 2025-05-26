// docs/.vitepress/utils/services/content/sessions.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../../..');
const sessionsDir = path.join(projectRoot, 'docs/log/sessions');

/**
 * Get all session notes from individual files
 * @returns {Array} Array of session objects
 */
export async function getSessions() {
  try {
    // Ensure sessions directory exists
    await fs.mkdir(sessionsDir, { recursive: true });
    
    // Read all session files
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(file => file.endsWith('.md'));
    
    const sessions = [];
    
    for (const file of sessionFiles) {
      const filepath = path.join(sessionsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // Debug logging for date parsing issues
      if (typeof frontmatter.date === 'object' && frontmatter.date !== null) {
        console.warn(`⚠️  Session ${file}: Date parsed as object:`, frontmatter.date);
        // Convert to string if it's a Date object
        if (frontmatter.date instanceof Date) {
          frontmatter.date = frontmatter.date.toISOString().split('T')[0];
        } else {
          console.error(`❌ Session ${file}: Date is object but not Date instance:`, frontmatter.date);
          // Try to extract from filename as fallback
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          frontmatter.date = dateMatch ? dateMatch[1] : '2025-01-01';
        }
      }
      
      sessions.push({
        filename: file,
        url: `/log/sessions/${file.replace('.md', '')}`,
        date: frontmatter.date,
        session: frontmatter.session,
        type: frontmatter.type || 'session',
        author: frontmatter.author || 'Claude',
        content: markdownContent.trim(),
        frontmatter
      });
    }
    
    // Sort by session number, newest first
    sessions.sort((a, b) => b.session - a.session);
    
    console.log(`📝 Loaded ${sessions.length} session notes`);
    return sessions;
    
  } catch (error) {
    console.error('❌ Failed to load sessions:', error);
    return [];
  }
}

export default getSessions;