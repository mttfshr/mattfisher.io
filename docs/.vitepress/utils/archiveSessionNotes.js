// docs/.vitepress/utils/archiveSessionNotes.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../..');
const projectSummaryPath = path.resolve(docsDir, '../PROJECT_SUMMARY.md');
const logEntriesPath = path.resolve(docsDir, 'log/entries.md');

/**
 * Archives session notes older than the most recent 5 sessions
 * from PROJECT_SUMMARY.md to log/entries.md
 */
async function archiveSessionNotes() {
  try {
    console.log('Starting session notes archiving process...');
    
    // Read project summary file
    const projectSummary = await fs.readFile(projectSummaryPath, 'utf8');
    
    // Find the session notes section
    const sessionNotesRegex = /## Session Notes\s+\*\*Note\*\*:.*?\n\n([\s\S]*?)(?=\n## |$)/;
    const sessionNotesMatch = projectSummary.match(sessionNotesRegex);
    
    if (!sessionNotesMatch) {
      console.log('No session notes section found or it has unexpected format.');
      return;
    }
    
    // Extract session summaries using improved regex
    // The previous regex was not properly capturing all session blocks
    const sessionRegex = /### ([^\n]+?Summary)\s+([\s\S]*?)(?=\n### |$)/g;
    const sessions = [];
    let match;
    
    let fullSessionContent = sessionNotesMatch[1];
    
    while ((match = sessionRegex.exec(fullSessionContent)) !== null) {
      sessions.push({
        title: match[1],
        content: match[2].trim()
      });
    }
    
    console.log(`Found ${sessions.length} sessions in PROJECT_SUMMARY.md`);
    
    // Keep the 5 most recent sessions
    const recentSessions = sessions.slice(0, 5);
    const oldSessions = sessions.slice(5);
    
    if (oldSessions.length === 0) {
      console.log('No sessions old enough to archive.');
      return;
    }
    
    console.log(`Archiving ${oldSessions.length} older sessions...`);
    
    // Read existing log entries
    let logEntries = '';
    try {
      logEntries = await fs.readFile(logEntriesPath, 'utf8');
    } catch (error) {
      // If the file doesn't exist, create it with empty content
      console.log('Log entries file not found, creating new file.');
      await fs.writeFile(logEntriesPath, '', 'utf8');
    }
    
    // Prepare entries to add to the log
    let newEntries = '';
    
    for (const session of oldSessions) {
      // Extract date and session number with more robust regex
      const dateMatch = session.title.match(/([A-Za-z]+ \d+, \d{4}) - Session (\d+)/);
      
      if (!dateMatch) {
        console.log(`Warning: Could not parse date from session title: ${session.title}`);
        continue;
      }
      
      const [, dateLong, sessionNum] = dateMatch;
      
      // Convert "May 16, 2025" to "2025-05-16" format
      const dateObj = new Date(dateLong);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Format content with proper line breaks and make sure there are no merged entries
      let formattedContent = session.content.trim()
        .replace(/^- /gm, '\n- ') // Add extra line break before each list item
        .replace(/\n- /g, '\n\n- ') // Ensure double line breaks before each list item
        .trim();
      
      // Format as a log entry - with proper separations
      newEntries += `\n\n---\n\n# ${formattedDate}: Development Session ${sessionNum}\n`;
      newEntries += `*Session notes are written by Claude*\n\n`;
      newEntries += formattedContent;
    }
    
    // Update log entries - add at the beginning
    // Make sure we have a clear separation between entries with proper formatting
    if (logEntries.trim() !== '') {
      // If there's existing content, ensure there's proper separation
      let updatedLogEntries = newEntries.trim() + logEntries;
      await fs.writeFile(logEntriesPath, updatedLogEntries, 'utf8');
    } else {
      // If it's a new file, just write the new entries
      await fs.writeFile(logEntriesPath, newEntries.trim(), 'utf8');
    }
    
    // Check the updated file to ensure no merged entries
    const updatedContent = await fs.readFile(logEntriesPath, 'utf8');
    const mergedEntryCheck = updatedContent.match(/\*Session notes are written by Claude\*\n\n-.*?#/gs);
    if (mergedEntryCheck) {
      console.log('Warning: Possible merged entries detected in the output. Fixing...');
      
      // Fix any merged entries by ensuring proper separation
      const fixedContent = updatedContent.replace(
        /(\*Session notes are written by Claude\*\n\n.+?)(\n# )/gs, 
        '$1\n\n---\n$2'
      );
      
      await fs.writeFile(logEntriesPath, fixedContent, 'utf8');
    }
    
    // Update PROJECT_SUMMARY with only recent sessions
    let updatedProjectSummary = projectSummary.replace(
      sessionNotesRegex,
      `## Session Notes\n\n**Note**: Only the 5 most recent sessions are kept here. Older sessions are archived in \`docs/log/entries.md\`.\n\n${
        recentSessions.map(s => `### ${s.title}\n${s.content}`).join('\n\n')
      }`
    );
    
    await fs.writeFile(projectSummaryPath, updatedProjectSummary);
    
    console.log('Session notes archived successfully!');
    console.log(`- ${recentSessions.length} recent sessions kept in PROJECT_SUMMARY.md`);
    console.log(`- ${oldSessions.length} older sessions moved to log/entries.md`);
    
    return {
      keptSessions: recentSessions.length,
      archivedSessions: oldSessions.length
    };
  } catch (error) {
    console.error('Error archiving session notes:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  archiveSessionNotes().catch(error => {
    console.error('Session archiving failed:', error);
    process.exit(1);
  });
}

export default archiveSessionNotes;
