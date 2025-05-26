// services/content/metadata.js
// Content metadata processing utilities

/**
 * Parse structured tags in the format key:value
 */
export function parseTags(tags) {
  const result = {
    type: [],
    tech: [],
    tool: [],
    status: [],
    medium: [],
    project: [],
    collab: [],
    other: []
  };
  
  if (!tags || !Array.isArray(tags)) return result;
  
  tags.forEach(tag => {
    if (typeof tag !== 'string') return;
    
    const [prefix, value] = tag.includes(':') ? tag.split(':', 2) : ['other', tag];
    
    if (result[prefix]) {
      result[prefix].push(value);
    } else {
      result.other.push(tag);
    }
  });
  
  return result;
}

/**
 * Extract hashtags from content text
 */
export function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.slice(1)) // Remove the # prefix
}

/**
 * Extract image references from markdown content
 */
export function extractImages(content) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  const images = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2]
    })
  }

  return images
}

/**
 * Collection configuration for UI display
 */
const COLLECTIONS_CONFIG = {
  music: { name: 'Music', icon: '🎵' },
  video: { name: 'Video', icon: '🎬' },
  article: { name: 'Articles', icon: '📝' },
  code: { name: 'Code', icon: '💻' },
  design: { name: 'Design', icon: '🎨' },
  research: { name: 'Research', icon: '🔬' },
  inspiration: { name: 'Inspiration', icon: '✨' },
  tools: { name: 'Tools', icon: '🔧' },
  tutorials: { name: 'Tutorials', icon: '📚' }
};

/**
 * Metadata configuration for UI display
 */
const METADATA_CONFIG = {
  type: { label: 'Type', icon: '🏷️' },
  source: { label: 'Source', icon: '🌐' },
  contentType: { label: 'Content Type', icon: '📁' },
  artist: { label: 'Artist', icon: '🎤' },
  creator: { label: 'Creator', icon: '👤' },
  author: { label: 'Author', icon: '✍️' },
  year: { label: 'Year', icon: '📅' },
  genre: { label: 'Genre', icon: '🎭' },
  mood: { label: 'Mood', icon: '🎨' },
  tech: { label: 'Technology', icon: '⚙️' },
  tool: { label: 'Tool', icon: '🔧' },
  status: { label: 'Status', icon: '📊' },
  medium: { label: 'Medium', icon: '🖼️' },
  project: { label: 'Project', icon: '📂' },
  collab: { label: 'Collaboration', icon: '🤝' }
};

/**
 * Get collection configuration by ID
 */
export function getCollectionById(collectionId) {
  return COLLECTIONS_CONFIG[collectionId] || { name: collectionId, icon: '📁' };
}

/**
 * Get metadata configuration for a key
 */
export function getMetadataConfig(key) {
  return METADATA_CONFIG[key] || { label: key, icon: '🏷️' };
}

/**
 * Get highlighted metadata keys for display in pin cards
 */
export function getHighlightedMetadataKeys() {
  return ['type', 'source', 'artist', 'creator', 'year', 'genre'];
}

/**
 * Get appropriate icon for metadata values
 */
export function getMetadataValueIcon(key, value) {
  // Source-specific icons
  if (key === 'source') {
    switch (value) {
      case 'spotify': return '🎵';
      case 'vimeo': return '🎬';
      case 'youtube': return '📺';
      case 'github': return '💻';
      case 'bandcamp': return '🎶';
      case 'medium': return '✍️';
      case 'twitter': return '🐦';
      case 'instagram': return '📷';
      case 'dribbble': return '🎨';
      case 'behance': return '🎭';
      case 'figma': return '🔧';
      default: return '🌐';
    }
  }
  
  // Type-specific icons
  if (key === 'type') {
    switch (value) {
      case 'music': return '🎵';
      case 'video': return '🎬';
      case 'article': return '📝';
      case 'code': return '💻';
      case 'design': return '🎨';
      case 'image': return '🖼️';
      case 'document': return '📑';
      case 'social': return '💬';
      default: return '🔗';
    }
  }
  
  // Content type specific icons
  if (key === 'contentType') {
    switch (value) {
      case 'album': return '💿';
      case 'playlist': return '📻';
      case 'track': return '🎵';
      case 'artist': return '🎤';
      case 'repository': return '📦';
      case 'profile': return '👤';
      case 'audio-file': return '🎧';
      case 'video-file': return '🎞️';
      default: return '📄';
    }
  }
  
  // Default fallback based on key
  switch (key) {
    case 'artist':
    case 'creator':
    case 'author':
      return '👤';
    case 'year':
      return '📅';
    case 'genre':
      return '🎭';
    case 'mood':
      return '💭';
    case 'tech':
      return '⚙️';
    case 'tool':
      return '🔧';
    case 'status':
      return '📊';
    case 'medium':
      return '🖼️';
    case 'project':
      return '📂';
    case 'collab':
      return '🤝';
    default:
      return '🏷️';
  }
}
