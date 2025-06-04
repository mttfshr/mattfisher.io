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
      
      // Extract date and session number from filename as fallback
      const fileMatch = file.match(/^(\d{4}-\d{2}-\d{2})-session-(\d+)\.md$/);
      const fallbackDate = fileMatch ? fileMatch[1] : '2025-01-01';
      const fallbackSession = fileMatch ? parseInt(fileMatch[2]) : 0;
      
      // Use frontmatter if available, otherwise use filename extraction
      let sessionDate = frontmatter.date;
      let sessionNumber = frontmatter.session;
      
      // Handle frontmatter date conversion
      if (typeof sessionDate === 'object' && sessionDate !== null) {
        if (sessionDate instanceof Date) {
          sessionDate = sessionDate.toISOString().split('T')[0];
        } else {
          sessionDate = fallbackDate;
        }
      }
      
      // Use filename data if frontmatter is missing
      if (!sessionDate) sessionDate = fallbackDate;
      if (!sessionNumber) sessionNumber = fallbackSession;
      
      sessions.push({
        filename: file,
        url: `/log/sessions/${file.replace('.md', '')}`,
        date: sessionDate,
        session: sessionNumber,
        type: frontmatter.type || 'session',
        author: frontmatter.author || 'Claude',
        content: markdownContent.trim(),
        frontmatter
      });
    }
    
    // Sort by session number, newest first
    sessions.sort((a, b) => b.session - a.session);
    
    console.log(`📝 Loaded ${sessions.length} session notes (with filename fallback support)`);
    
    // Debug log to show which sessions were loaded
    if (sessions.length > 0) {
      const recentSessions = sessions.slice(0, 5);
      console.log('Most recent sessions loaded:');
      recentSessions.forEach(s => {
        console.log(`  Session ${s.session} (${s.date}) - ${s.filename}`);
      });
    }
    return sessions;
    
  } catch (error) {
    console.error('❌ Failed to load sessions:', error);
    return [];
  }
}

export default getSessions;