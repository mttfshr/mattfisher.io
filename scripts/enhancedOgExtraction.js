// scripts/enhancedOgExtraction.js
// Import issue workaround for node-fetch@2
import nodeFetch from 'node-fetch';
const fetch = nodeFetch.default || nodeFetch;
import * as cheerio from 'cheerio';

/**
 * Fetches a URL and extracts Open Graph metadata
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<Object>} - Object with metadata from OG tags
 */
export async function extractOpenGraphData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LogPinBot/1.0; +http://mattfisher.io)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Extract Open Graph metadata
    const metadata = {
      title: '',
      description: '',
      imageUrl: '',
      siteName: '',
      favicon: ''
    }
    
    // OG tags
    metadata.title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') || 
                    $('title').text() || ''
                    
    metadata.description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="twitter:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || ''
                          
    metadata.imageUrl = $('meta[property="og:image"]').attr('content') || 
                       $('meta[name="twitter:image"]').attr('content') || ''
                       
    metadata.siteName = $('meta[property="og:site_name"]').attr('content') || ''
    
    // Get favicon
    metadata.favicon = $('link[rel="icon"]').attr('href') || 
                      $('link[rel="shortcut icon"]').attr('href') || 
                      $('link[rel="apple-touch-icon"]').attr('href') || ''
    
    // If favicon is a relative path, convert to absolute
    if (metadata.favicon && !metadata.favicon.startsWith('http')) {
      const urlObj = new URL(url)
      const base = `${urlObj.protocol}//${urlObj.host}`
      
      if (metadata.favicon.startsWith('/')) {
        metadata.favicon = `${base}${metadata.favicon}`
      } else {
        metadata.favicon = `${base}/${metadata.favicon}`
      }
    }
    
    // If we couldn't find a site name, use the hostname
    if (!metadata.siteName) {
      try {
        metadata.siteName = new URL(url).hostname.replace(/^www\./, '')
      } catch (e) {
        // Do nothing
      }
    }
    
    // Clean up any titles that have the site name appended (common pattern)
    if (metadata.title && metadata.siteName && metadata.title.includes(metadata.siteName)) {
      metadata.title = metadata.title
        .replace(` - ${metadata.siteName}`, '')
        .replace(` | ${metadata.siteName}`, '')
        .replace(` — ${metadata.siteName}`, '')
    }
    
    return metadata
  } catch (error) {
    console.error(`Error extracting OG data from ${url}:`, error)
    
    // Return basic data based on the URL
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '')
      return {
        title: hostname,
        description: '',
        imageUrl: '',
        siteName: hostname,
        favicon: ''
      }
    } catch (e) {
      return {
        title: url,
        description: '',
        imageUrl: '',
        siteName: '',
        favicon: ''
      }
    }
  }
}
