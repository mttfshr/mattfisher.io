#!/usr/bin/env node

/**
 * Fix session migration - properly extract content from backup file
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const backupFile = path.join(projectRoot, 'docs/log/sessions.md.backup');
const sessionsDir = path.join(projectRoot, 'docs/log/sessions');

async function fixSessionMigration() {
  try {
    console.log('🔄 Fixing session migration from backup file...');
    
    // Read the backup file
    const content = await fs.readFile(backupFile, 'utf8');
    
    // Split by session headers - the format is: # YYYY-MM-DD: Development Session NN
    const sections = content.split(/(?=^# \d{4}-\d{2}-\d{2}: Development Session \d+)/gm);
    
    console.log(`📊 Found ${sections.length} sections in backup file`);
    
    const sessions = [];
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      // Extract session info from header
      const headerMatch = section.match(/^# (\d{4}-\d{2}-\d{2}): Development Session (\d+)/);
      if (!headerMatch) {
        console.log('⚠️ Skipping section without valid header:', section.substring(0, 50));
        continue;
      }
      
      const dateStr = headerMatch[1];
      const sessionNum = parseInt(headerMatch[2]);
      
      // Extract content - everything after the header line
      const lines = section.split('\n');
      const contentLines = lines.slice(1); // Skip the header line
      const sessionContent = contentLines.join('\n').trim();
      
      sessions.push({
        date: dateStr,
        session: sessionNum,
        content: sessionContent
      });
    }
    
    console.log(`📝 Extracted ${sessions.length} sessions with content`);
    
    // Process each session
    for (const session of sessions) {
      const filename = `${session.date}-session-${session.session.toString().padStart(2, '0')}.md`;
      const filepath = path.join(sessionsDir, filename);
      
      // Create frontmatter
      const frontmatter = `---
date: ${session.date}
session: ${session.session}
type: session
author: Claude
---

`;
      
      // Clean up content - remove the "*Session notes are written by Claude*" line and extra whitespace
      let cleanContent = session.content
        .replace(/^\*Session notes are written by Claude\*\s*\n?/gm, '')
        .trim();
      
      // Ensure it starts with a proper header
      if (!cleanContent.startsWith('#')) {
        cleanContent = `# Session ${session.session} Summary\n\n${cleanContent}`;
      }
      
      const finalContent = frontmatter + cleanContent;
      
      // Write the file
      await fs.writeFile(filepath, finalContent, 'utf8');
      console.log(`✅ Fixed: ${filename} (${cleanContent.length} chars)`);
    }
    
    console.log(`🎉 Migration fix complete! Updated ${sessions.length} session files`);
    
  } catch (error) {
    console.error('❌ Migration fix failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fixSessionMigration().catch(console.error);
}

export default fixSessionMigration;