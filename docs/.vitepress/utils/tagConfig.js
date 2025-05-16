// docs/.vitepress/utils/tagConfig.js

/**
 * Configuration for collections
 * Define collection details including name, description, and icon
 */
export const collections = [
  {
    id: 'music_library',
    name: 'Music Library',
    description: 'Saved albums, tracks, and playlists from various music services',
    icon: '🎵',
    featured: true
  },
  {
    id: 'my_playlists',
    name: 'My Playlists',
    description: 'Playlists created by me on Spotify and other services',
    icon: '🎧',
    featured: true
  },
  {
    id: 'followed_playlists',
    name: 'Followed Playlists',
    description: 'Playlists created by others that I follow',
    icon: '👂',
    featured: true
  },
  {
    id: 'essential_viewing',
    name: 'Essential Viewing',
    description: 'Must-see videos that have influenced my thinking',
    icon: '🎬',
    featured: false
  },
  {
    id: 'design_inspiration',
    name: 'Design Inspiration',
    description: 'Resources that inspire design thinking and creativity',
    icon: '✨',
    featured: false
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Useful software, libraries, and utilities',
    icon: '🛠️',
    featured: false
  }
];

/**
 * Configuration for metadata keys
 * Define how each metadata key should be displayed and filtered
 */
export const metadataConfig = {
  type: {
    label: 'Type',
    description: 'Content type or format',
    icon: '📄',
    highlighted: true,
    valueIcons: {
      'music': '🎵',
      'video': '🎬',
      'article': '📝',
      'code': '💻',
      'image': '🖼️',
      'design': '🎨',
      'document': '📑',
      'social': '💬',
      'link': '🔗'
    }
  },
  source: {
    label: 'Source',
    description: 'Platform or website origin',
    icon: '🌐',
    highlighted: true,
    valueIcons: {
      'spotify': '🎧',
      'vimeo': '🎥',
      'youtube': '📺',
      'github': '🐙',
      'medium': '📓',
      'twitter': '🐦',
      'instagram': '📷',
      'bandcamp': '💿'
    }
  },
  contentType: {
    label: 'Content Format',
    description: 'Specific format or type of content',
    icon: '📋',
    highlighted: false
  },
  artist: {
    label: 'Artist',
    description: 'Musical artist or creator',
    icon: '🧑‍🎤',
    highlighted: true
  },
  creator: {
    label: 'Creator',
    description: 'Person who created the content',
    icon: '👤',
    highlighted: true
  },
  genre: {
    label: 'Genre',
    description: 'Style or category of content',
    icon: '🏷️',
    highlighted: true
  },
  year: {
    label: 'Year',
    description: 'Year of publication or release',
    icon: '📅',
    highlighted: true,
    filterType: 'range'
  },
  tracks: {
    label: 'Tracks',
    description: 'Number of tracks in a playlist or album',
    icon: '🔢',
    highlighted: false,
    filterType: 'range'
  },
  popularity: {
    label: 'Popularity',
    description: 'How popular the content is',
    icon: '📊',
    highlighted: false,
    valueIcons: {
      'high': '🔥',
      'medium': '👍',
      'low': '💎'
    }
  },
  mood: {
    label: 'Mood',
    description: 'Emotional quality or atmosphere',
    icon: '😊',
    highlighted: true,
    valueIcons: {
      'happy': '😄',
      'sad': '😢',
      'energetic': '⚡',
      'calm': '😌',
      'dark': '🌑',
      'inspirational': '✨'
    }
  }
};

/**
 * Helper function to get collection by ID
 */
export function getCollectionById(id) {
  return collections.find(c => c.id === id) || null;
}

/**
 * Helper function to get metadata config by key
 */
export function getMetadataConfig(key) {
  return metadataConfig[key] || {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    description: `${key.charAt(0).toUpperCase() + key.slice(1)} metadata`,
    icon: '🏷️',
    highlighted: false
  };
}

/**
 * Get icon for a metadata value
 */
export function getMetadataValueIcon(key, value) {
  const config = getMetadataConfig(key);
  if (config.valueIcons && config.valueIcons[value]) {
    return config.valueIcons[value];
  }
  return config.icon;
}

/**
 * Get featured collections
 */
export function getFeaturedCollections() {
  return collections.filter(c => c.featured);
}

/**
 * Get all highlighted metadata keys
 */
export function getHighlightedMetadataKeys() {
  return Object.entries(metadataConfig)
    .filter(([key, config]) => config.highlighted)
    .map(([key]) => key);
}
