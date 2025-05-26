// docs/.vitepress/utils/htmlEntities.js
/**
 * Decode HTML entities in a string
 * @param {string} html - String with HTML entities
 * @returns {string} - Decoded string
 */
export function decodeHtmlEntities(html) {
  if (!html) return '';
  
  // Create a textarea element to use the browser's built-in HTML entity decoding
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  const decoded = textarea.value;
  
  // For Node.js environment where document is not available
  if (typeof document === 'undefined') {
    return html
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'")
      .replace(/&#x60;/g, '`')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  
  return decoded;
}

/**
 * Simple version of HTML entity decoder that works in Node.js
 * @param {string} html - String with HTML entities
 * @returns {string} - Decoded string
 */
export function decodeHtmlEntitiesNode(html) {
  if (!html) return '';
  
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}
