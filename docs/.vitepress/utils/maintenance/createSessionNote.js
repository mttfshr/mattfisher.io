// docs/.vitepress/utils/maintenance/createSessionNote.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
const sessionsDir = path.join(projectRoot, 'docs/log/sessions');

/**
 * Create a new session note file
 * @param {number} sessionNumber - The session number
 * @param {string} content - The session content (markdown)
 * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<string>} - Path to the created file
 */
export async function createSessionNote(sessionNumber, content, date = null) {
  try {
    // Use provided date or default to today
    const sessionDate = date || new Date().toISOString().split('T')[0];
    
    // Create filename with zero-padded session number
    const filename = `${sessionDate}-session-${sessionNumber.toString().padStart(2, '0')}.md`;
    const filepath = path.join(sessionsDir, filename);
    
    // Check if file already exists
    try {
      await fs.access(filepath);
      throw new Error(`Session file already exists: ${filename}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error; // Re-throw if it's not a "file not found" error
      }
      // File doesn't exist, which is what we want
    }
    
    // Create frontmatter
    const frontmatter = `---
date: ${sessionDate}
session: ${sessionNumber}
type: session
author: Claude
---

`;
    
    // Clean up content - ensure it starts with a proper heading
    let cleanContent = content.trim();
    if (!cleanContent.startsWith('#')) {
      cleanContent = `# Session ${sessionNumber} Summary\n\n${cleanContent}`;
    }
    
    // Combine frontmatter and content
    const finalContent = frontmatter + cleanContent;
    
    // Ensure sessions directory exists
    await fs.mkdir(sessionsDir, { recursive: true });
    
    // Write the file
    await fs.writeFile(filepath, finalContent, 'utf8');
    
    console.log(`✅ Created session file: ${filename}`);
    return filepath;
    
  } catch (error) {
    console.error('❌ Failed to create session file:', error);
    throw error;
  }
}

/**
 * Get the next session number by checking existing files
 * @returns {Promise<number>} - The next session number to use
 */
export async function getNextSessionNumber() {
  try {
    // Ensure sessions directory exists
    await fs.mkdir(sessionsDir, { recursive: true });
    
    // Read all session files
    const files = await fs.readdir(sessionsDir);
    
    // Extract session numbers from filenames
    const sessionNumbers = files
      .filter(file => file.endsWith('.md') && file.includes('session'))
      .map(file => {
        const match = file.match(/-session-(\d+)\.md$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    // Return the next session number
    const maxSession = sessionNumbers.length > 0 ? Math.max(...sessionNumbers) : 0;
    return maxSession + 1;
    
  } catch (error) {
    console.error('❌ Failed to get next session number:', error);
    return 1; // Default to session 1 if there's an error
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node createSessionNote.js <session-number> "<content>" [date]');
    console.log('Example: node createSessionNote.js 50 "- Fixed archive script\\n- Updated imports" 2025-05-26');
    process.exit(1);
  }
  
  const sessionNumber = parseInt(args[0]);
  const content = args[1];
  const date = args[2] || null;
  
  createSessionNote(sessionNumber, content, date)
    .then(filepath => {
      console.log(`🎉 Session note created: ${filepath}`);
    })
    .catch(error => {
      console.error('Failed to create session note:', error);
      process.exit(1);
    });
}

export default createSessionNote;