// Pinterest API connector for fetching boards and pins
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

/**
 * Fetch user's Pinterest boards and pins
 * @param {string} docsDir - Directory to save the pins file
 */
export default async function fetchPinterestPins(docsDir) {
  if (!PINTEREST_ACCESS_TOKEN) {
    console.error('❌ Pinterest access token not found in environment variables');
    console.log('Please add PINTEREST_ACCESS_TOKEN to your .env file');
    return false;
  }

  try {
    console.log('🔗 Fetching Pinterest boards and pins...');
    
    // Fetch user's boards
    const boards = await fetchUserBoards();
    console.log(`📌 Found ${boards.length} boards`);
    
    // Fetch pins for each board
    let allPins = [];
    let allCollections = [];
    
    for (const board of boards) {
      console.log(`📋 Processing board: "${board.name}" (${board.pin_count} pins)`);
      
      const boardPins = await fetchBoardPins(board.id);
      
      // Add board info to each pin
      const enhancedPins = boardPins.map(pin => ({
        ...pin,
        board: {
          id: board.id,
          name: board.name,
          slug: createSlug(board.name),
          description: board.description,
          privacy: board.privacy
        }
      }));
      
      allPins = [...allPins, ...enhancedPins];
      
      // Create collection for this board
      allCollections.push({
        name: board.name,
        slug: createSlug(board.name),
        description: board.description,
        pinCount: boardPins.length,
        privacy: board.privacy
      });
    }

    console.log(`📌 Total pins collected: ${allPins.length}`);
    
    // Generate markdown content
    const markdownContent = generatePinterestMarkdown(allPins, allCollections);
    
    // Save to pins directory
    const pinsFile = path.join(docsDir, 'pins', 'pinterest.md');
    await fs.writeFile(pinsFile, markdownContent, 'utf8');
    
    console.log(`✅ Pinterest pins saved to ${pinsFile}`);
    console.log(`📊 Summary: ${allPins.length} pins from ${boards.length} boards`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fetching Pinterest data:', error.message);
    return false;
  }
}

/**
 * Fetch user's boards from Pinterest API
 */
async function fetchUserBoards() {
  const url = `${PINTEREST_API_BASE}/boards`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Pinterest API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch pins from a specific board
 */
async function fetchBoardPins(boardId) {
  const url = `${PINTEREST_API_BASE}/boards/${boardId}/pins`;
  let allPins = [];
  let cursor = null;
  
  do {
    const urlWithCursor = cursor ? `${url}?cursor=${cursor}` : url;
    
    const response = await fetch(urlWithCursor, {
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Error fetching pins for board ${boardId}: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    allPins = [...allPins, ...(data.items || [])];
    cursor = data.bookmark;
    
    // Rate limiting - be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } while (cursor);
  
  return allPins;
}

/**
 * Generate markdown content for Pinterest pins
 */
function generatePinterestMarkdown(pins, collections) {
  const timestamp = new Date().toISOString();
  
  let content = `# Pinterest Pins

<!-- Generated on ${timestamp} -->
<!-- Total pins: ${pins.length} -->
<!-- Collections: ${collections.length} -->

`;

  // Group pins by board for organized output
  const pinsByBoard = pins.reduce((acc, pin) => {
    const boardName = pin.board.name;
    if (!acc[boardName]) {
      acc[boardName] = [];
    }
    acc[boardName].push(pin);
    return acc;
  }, {});

  // Generate content for each board
  Object.entries(pinsByBoard).forEach(([boardName, boardPins]) => {
    const board = boardPins[0].board; // Get board info from first pin
    
    content += `## ${boardName}\n\n`;
    if (board.description) {
      content += `*${board.description}*\n\n`;
    }
    
    boardPins.forEach(pin => {
      const title = pin.title || 'Untitled Pin';
      const url = pin.link || `https://pinterest.com/pin/${pin.id}`;
      const description = pin.description || '';
      
      // Create tags
      const tags = [
        '#type:pin',
        '#source:pinterest',
        `#board:${board.slug}`,
        `#collection:${board.slug}`,
        '#saved'
      ];
      
      // Add category tags based on board name
      const category = inferCategory(boardName);
      if (category) {
        tags.push(`#category:${category}`);
      }
      
      // Add privacy tag
      if (board.privacy) {
        tags.push(`#privacy:${board.privacy}`);
      }
      
      // Add year if available (from created_at)
      if (pin.created_at) {
        const year = new Date(pin.created_at).getFullYear();
        tags.push(`#year:${year}`);
      }
      
      content += `- [${title}](${url}) ${tags.join(' ')}\n`;
      
      if (description) {
        content += `  *${description.substring(0, 100)}${description.length > 100 ? '...' : ''}*\n`;
      }
      content += '\n';
    });
    
    content += '\n';
  });

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
 * Infer category from board name
 */
function inferCategory(boardName) {
  const name = boardName.toLowerCase();
  
  // Design-related boards
  if (name.includes('design') || name.includes('ui') || name.includes('ux') || name.includes('graphic')) {
    return 'design';
  }
  
  // Music-related boards
  if (name.includes('music') || name.includes('synth') || name.includes('audio') || name.includes('sound')) {
    return 'music';
  }
  
  // Art-related boards
  if (name.includes('art') || name.includes('visual') || name.includes('gallery') || name.includes('artist')) {
    return 'art';
  }
  
  // Architecture-related boards
  if (name.includes('architect') || name.includes('building') || name.includes('space')) {
    return 'architecture';
  }
  
  // Technology-related boards
  if (name.includes('tech') || name.includes('code') || name.includes('dev') || name.includes('programming')) {
    return 'technology';
  }
  
  return 'inspiration'; // default category
}
