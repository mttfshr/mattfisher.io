#!/usr/bin/env node

/**
 * Migrate sessions.md content to individual session files
 * This script splits the monolithic sessions.md into separate files per session
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sessionsFile = path.join(projectRoot, 'docs/log/sessions.md');
const sessionsDir = path.join(projectRoot, 'docs/log/sessions');

async function migrateSessions() {
  try {
    console.log('🔄 Starting session migration...');
    
    // Read the sessions.md file
    const content = await fs.readFile(sessionsFile, 'utf8');
    
    // Split into individual sessions using regex
    const sessionRegex = /^# (\d{4}-\d{2}-\d{2}): Development Session (\d+)[\s\S]*?(?=^# \d{4}-\d{2}-\d{2}: Development Session \d+|$)/gm;
    
    let sessions = [];
    let match;
    
    while ((match = sessionRegex.exec(content)) !== null) {
      const dateStr = match[1];
      const sessionNum = match[2];
      const sessionContent = match[0].trim();
      
      sessions.push({
        date: dateStr,
        session: parseInt(sessionNum),
        content: sessionContent
      });
    }
    
    console.log(`📊 Found ${sessions.length} sessions to migrate`);
    
    // Ensure sessions directory exists
    await fs.mkdir(sessionsDir, { recursive: true });
    
    // Create individual session files
    for (const session of sessions) {
      const filename = `${session.date}-session-${session.session.toString().padStart(2, '0')}.md`;
      const filepath = path.join(sessionsDir, filename);
      
      // Convert to new format with frontmatter
      const frontmatter = `---
date: ${session.date}
session: ${session.session}
type: session
author: Claude
---

`;
      
      // Clean up the content (remove the date header since it's in frontmatter)
      const cleanContent = session.content
        .replace(/^# \d{4}-\d{2}-\d{2}: Development Session \d+/, '# Session ' + session.session + ' Summary')
        .trim();
      
      const finalContent = frontmatter + cleanContent;
      
      await fs.writeFile(filepath, finalContent, 'utf8');
      console.log(`✅ Created: ${filename}`);
    }
    
    console.log(`🎉 Migration complete! Created ${sessions.length} session files`);
    console.log(`📁 Session files location: docs/log/sessions/`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Update VitePress config to use createContentLoader() for sessions`);
    console.log(`2. Update log page to display aggregated sessions`);
    console.log(`3. Backup and remove old sessions.md file`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateSessions().catch(console.error);
}

export default migrateSessions;