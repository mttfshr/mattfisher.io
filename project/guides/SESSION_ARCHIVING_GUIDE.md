# Session Notes Archiving System

This document describes the session notes archiving system for the mattfisher.io project.

## Overview

To keep the PROJECT_SUMMARY.md file manageable and focused on current work, we've implemented a system that archives older session notes to the site's log entries. This maintains a clean project summary while preserving the development history in a browsable format.

## How It Works

1. **Retention Policy**:
   - PROJECT_SUMMARY.md retains only the 5 most recent session notes
   - Older sessions are automatically moved to docs/log/entries.md
   - The full development history remains accessible through the site's Log section

2. **Archiving Process**:
   - Session notes are extracted from PROJECT_SUMMARY.md
   - Notes older than the 5 most recent are converted to dated log entries
   - These entries are added to log/entries.md
   - PROJECT_SUMMARY.md is updated to contain only recent sessions

3. **Log Entry Format**:
   - Archived sessions appear as dated log entries: "# YYYY-MM-DD: Development Session X"
   - Attribution note indicates that Claude authored the content: "*Written by Claude, Anthropic's AI assistant*"
   - The full content of each session is preserved
   - Entries are separated by horizontal rules for clarity

## Usage

Run the archiving process whenever the PROJECT_SUMMARY becomes too long:

```bash
npm run archive-sessions
```

This script:
1. Analyzes the current PROJECT_SUMMARY.md
2. Identifies sessions to archive
3. Moves them to log/entries.md
4. Updates PROJECT_SUMMARY.md with only recent sessions

## Benefits

- **Prevents document bloat**: Keeps PROJECT_SUMMARY.md focused and manageable
- **Preserves history**: No information is lost during archiving
- **Integrates with site**: Uses existing log structure for historical records
- **Creates searchable history**: Makes past development work discoverable 
- **Streamlines onboarding**: New collaborators can focus on recent work

## Implementation Details

The system is implemented in `docs/.vitepress/utils/archiveSessionNotes.js`, which:
- Parses PROJECT_SUMMARY.md to extract session notes
- Identifies the 5 most recent sessions to keep
- Formats older sessions as log entries
- Updates both PROJECT_SUMMARY.md and log/entries.md

The script uses regular expressions to identify and extract session notes, ensuring that the document structure remains consistent.
