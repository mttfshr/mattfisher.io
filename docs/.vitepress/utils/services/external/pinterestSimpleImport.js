// Simplified Pinterest HTML export parser
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * Parse Pinterest HTML export and create simple pin/board lists
 * @param {string} htmlFilePath - Path to the Pinterest export HTML file
 * @param {string} docsDir - Directory to save the files
 */
export default async function importPinterestExportSimple(htmlFilePath, docsDir) {
  try {
    console.log('📖 Reading Pinterest export file...');
    
    // Read the HTML file
    const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
    console.log(`📄 File size: ${Math.round(htmlContent.length / 1024)}KB`);
    
    // Parse HTML with JSDOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract simple data
    const boards = extractBoards(document);
    const pins = extractPins(document);
    
    console.log(`📌 Found ${boards.length} boards and ${pins.length} pins`);
    
    // Generate simple markdown files
    const pinsMarkdown = generatePinsMarkdown(pins);
    const boardsMarkdown = generateBoardsMarkdown(boards);
    
    // Save files
    const pinsFile = path.join(docsDir, 'pinterest-pins.md');
    const boardsFile = path.join(docsDir, 'pinterest-boards.md');
    
    await fs.writeFile(pinsFile, pinsMarkdown, 'utf8');
    await fs.writeFile(boardsFile, boardsMarkdown, 'utf8');
    
    console.log(`✅ Pins saved to ${pinsFile}`);
    console.log(`✅ Boards saved to ${boardsFile}`);
    console.log(`📊 Summary: ${pins.length} pins from ${boards.length} boards`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error importing Pinterest data:', error.message);
    return false;
  }
}

/**
 * Extract boards with just name and created date
 */
function extractBoards(document) {
  const boards = [];
  
  // Find boards section
  const boardsSection = document.getElementById('40vkx');
  if (!boardsSection) return boards;
  
  let currentElement = boardsSection.nextSibling;
  let currentBoard = null;
  
  while (currentElement && currentElement.nodeName !== 'H1') {
    if (currentElement.nodeName === 'A' && currentElement.href) {
      // Save previous board
      if (currentBoard) boards.push(currentBoard);
      
      // Start new board
      currentBoard = {
        name: currentElement.textContent.trim(),
        url: currentElement.href,
        createdAt: null
      };
    } else if (currentElement.nodeName === 'BR' && currentElement.nextSibling) {
      const text = currentElement.nextSibling.textContent || '';
      if (text.startsWith('Created at:') && currentBoard) {
        currentBoard.createdAt = text.replace('Created at:', '').trim();
      }
    }
    currentElement = currentElement.nextSibling;
  }
  
  if (currentBoard) boards.push(currentBoard);
  return boards;
}

/**
 * Extract pins with canonical link, board name, and created date
 */
function extractPins(document) {
  const pins = [];
  
  // Find pins section
  const pinsSection = document.getElementById('db1sy');
  if (!pinsSection) return pins;
  
  let currentElement = pinsSection.nextSibling;
  let currentPin = null;
  
  while (currentElement) {
    if (currentElement.nodeName === 'A' && currentElement.href && currentElement.href.includes('pinterest.com/pin/')) {
      // Save previous pin if it has a canonical link
      if (currentPin && currentPin.canonicalLink && currentPin.canonicalLink !== 'No data') {
        pins.push(currentPin);
      }
      
      // Start new pin
      currentPin = {
        pinterestUrl: currentElement.href,
        canonicalLink: null,
        boardName: null,
        createdAt: null,
        title: null
      };
    } else if (currentElement.nodeName === 'BR' && currentElement.nextSibling) {
      const text = currentElement.nextSibling.textContent || '';
      
      if (text.startsWith('Board Name:') && currentPin) {
        currentPin.boardName = text.replace('Board Name:', '').trim();
      } else if (text.startsWith('Title:') && currentPin) {
        currentPin.title = text.replace('Title:', '').trim();
        if (currentPin.title === 'No data') currentPin.title = null;
      } else if (text.startsWith('Created at:') && currentPin) {
        currentPin.createdAt = text.replace('Created at:', '').trim();
      }
    } else if (currentElement.nodeName === 'A' && currentElement.href && currentElement.previousSibling) {
      // Check if this is a canonical link (previous text contains "Canonical Link:")
      const prevText = currentElement.previousSibling.textContent || '';
      if (prevText.includes('Canonical Link:') && currentPin) {
        currentPin.canonicalLink = currentElement.href;
      }
    }
    currentElement = currentElement.nextSibling;
  }
  
  // Add the last pin if it has a canonical link
  if (currentPin && currentPin.canonicalLink && currentPin.canonicalLink !== 'No data') {
    pins.push(currentPin);
  }
  
  return pins;
}

/**
 * Generate simple pins markdown with canonical links and tags
 */
function generatePinsMarkdown(pins) {
  const timestamp = new Date().toISOString();
  
  let content = `# Pinterest Pins

<!-- Generated from Pinterest export on ${timestamp} -->
<!-- Total pins: ${pins.length} -->

`;

  // Group by board
  const pinsByBoard = new Map();
  pins.forEach(pin => {
    const boardName = pin.boardName || 'Unknown Board';
    if (!pinsByBoard.has(boardName)) {
      pinsByBoard.set(boardName, []);
    }
    pinsByBoard.get(boardName).push(pin);
  });

  // Generate content with canonical links and tags
  for (const [boardName, boardPins] of pinsByBoard) {
    content += `## ${boardName}\n\n`;
    boardPins.forEach(pin => {
      const title = pin.title || 'Pinterest Pin';
      const boardSlug = createSlug(boardName);
      
      // Create tags matching your existing pin format
      const tags = [
        '#type:pin',
        '#source:pinterest',
        `#board:${boardSlug}`,
        `#collection:${boardSlug}`,
        '#saved'
      ];
      
      if (pin.createdAt) {
        const year = new Date(pin.createdAt).getFullYear();
        if (!isNaN(year)) {
          tags.push(`#year:${year}`);
        }
      }
      
      // Add created date as a comment instead of inline
      const createdComment = pin.createdAt ? ` <!-- ${pin.createdAt} -->` : '';
      
      content += `- [${title}](${pin.canonicalLink}) ${tags.join(' ')}${createdComment}\n`;
    });
    content += '\n';
  }

  return content;
}

/**
 * Create URL-friendly slug from text
 */
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Generate simple boards markdown
 */
function generateBoardsMarkdown(boards) {
  const timestamp = new Date().toISOString();
  
  let content = `# Pinterest Boards

<!-- Generated from Pinterest export on ${timestamp} -->
<!-- Total boards: ${boards.length} -->

`;

  boards.forEach(board => {
    const createdDate = board.createdAt ? ` (${board.createdAt})` : '';
    content += `- [${board.name}](${board.url})${createdDate}\n`;
  });

  return content;
}
