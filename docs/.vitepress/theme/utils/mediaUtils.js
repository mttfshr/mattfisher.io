// docs/.vitepress/theme/utils/mediaUtils.js

/**
 * Transforms a URL into an embed URL for various media providers
 * @param {Object} media - Media object with provider and url properties
 * @returns {string} - The appropriate embed URL
 */
export function getEmbedUrl(media) {
  if (!media || !media.url) return '';
  
  const { provider, url } = media;
  
  // Process Vimeo URLs
  if (provider === 'vimeo') {
    // Extract Vimeo ID (handles various Vimeo URL formats)
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
    }
  }
  
  // Process YouTube URLs
  if (provider === 'youtube') {
    // Extract YouTube ID (handles standard and short URLs)
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/|youtube\.com\/shorts\/)([^/?&#]+)/);
    if (youtubeMatch && youtubeMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
  }
  
  // If no provider match or unable to extract ID, return original URL
  return url;
}

/**
 * Get video thumbnail URL from video URL
 * @param {Object} media - Media object with provider and url properties
 * @returns {string|null} - Thumbnail URL or null if not available
 */
export function getVideoThumbnail(media) {
  if (!media) return null;
  
  // First check if there's a pre-generated thumbnailUrl from the plugin
  if (media.thumbnailUrl) {
    return media.thumbnailUrl;
  }
  
  if (!media.url) return null;
  
  const { provider, url } = media;
  
  // Process Vimeo URLs
  if (provider === 'vimeo') {
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      // Use the path that matches VitePress public directory structure
      const localThumbnail = `/media/thumbnails/vimeo-${vimeoMatch[1]}.jpg`;
      
      // Try using local thumbnail first
      return localThumbnail;
    }
  }
  
  // Process YouTube URLs
  if (provider === 'youtube') {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/|youtube\.com\/shorts\/)([^/?&#]+)/);
    if (youtubeMatch && youtubeMatch[1]) {
      // Use the path that matches VitePress public directory structure
      const localThumbnail = `/media/thumbnails/youtube-${youtubeMatch[1]}.jpg`;
      return localThumbnail;
    }
  }
  
  return null;
}

/**
 * Determines if a media object is embeddable
 * @param {Object} media - Media object from frontmatter
 * @returns {boolean} - Whether the media is embeddable
 */
export function isEmbeddable(media) {
  if (!media) return false;
  
  // Check embed flag if present
  if (media.embed === false) return false;
  
  // Check media type
  const embeddableTypes = ['video', 'audio'];
  if (!embeddableTypes.includes(media.type)) return false;
  
  // Check if we have a supported provider
  const supportedProviders = ['vimeo', 'youtube'];
  return supportedProviders.includes(media.provider);
}