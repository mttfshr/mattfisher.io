// docs/.vitepress/utils/mediaUtils.js
/**
 * Extract Vimeo ID from a Vimeo URL
 * @param {string} url - Vimeo URL
 * @returns {string|null} - Vimeo video ID or null if not found
 */
export function extractVimeoId(url) {
  if (!url) return null;

  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);

  return match ? match[1] : null;
}

/**
 * Extract YouTube ID from a YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID or null if not found
 */
export function extractYouTubeId(url) {
  if (!url) return null;

  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  return match ? match[1] : null;
}
