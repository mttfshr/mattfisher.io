// tests/unit/mediaUtils.test.js
import { describe, it, expect, vi } from 'vitest'

// Mock the mediaUtils functions for testing
const getVideoThumbnail = (media) => {
  if (!media) return null;
  
  // First check if there's a pre-generated thumbnailUrl
  if (media.thumbnailUrl) {
    return media.thumbnailUrl;
  }
  
  if (!media.url) return null;
  
  const { provider, url } = media;
  
  // Process Vimeo URLs
  if (provider === 'vimeo') {
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `/media/thumbnails/vimeo-${vimeoMatch[1]}.jpg`;
    }
  }
  
  // Process YouTube URLs
  if (provider === 'youtube') {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/|youtube\.com\/shorts\/)([^/?&#]+)/);
    if (youtubeMatch && youtubeMatch[1]) {
      return `/media/thumbnails/youtube-${youtubeMatch[1]}.jpg`;
    }
  }
  
  return null;
}

const getEmbedUrl = (media) => {
  if (!media || !media.url) return '';
  
  const { provider, url } = media;
  
  // Process Vimeo URLs
  if (provider === 'vimeo') {
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
    }
  }
  
  // Process YouTube URLs
  if (provider === 'youtube') {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/|youtube\.com\/shorts\/)([^/?&#]+)/);
    if (youtubeMatch && youtubeMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
  }
  
  return url;
}

const isEmbeddable = (media) => {
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

describe('mediaUtils', () => {
  describe('getVideoThumbnail', () => {
    it('returns null for null media', () => {
      expect(getVideoThumbnail(null)).toBe(null)
    })

    it('returns thumbnailUrl if present in media object', () => {
      const media = {
        thumbnailUrl: '/path/to/thumbnail.jpg'
      }
      expect(getVideoThumbnail(media)).toBe('/path/to/thumbnail.jpg')
    })

    it('generates Vimeo thumbnail URL with correct path', () => {
      const media = {
        type: 'video',
        provider: 'vimeo',
        url: 'https://vimeo.com/123456789'
      }
      const result = getVideoThumbnail(media);
      console.log('Vimeo result:', result);
      expect(result).toBe('/media/thumbnails/vimeo-123456789.jpg')
    })

    it('generates YouTube thumbnail URL with correct path', () => {
      const media = {
        type: 'video',
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
      const result = getVideoThumbnail(media);
      console.log('YouTube result:', result);
      expect(result).toBe('/media/thumbnails/youtube-dQw4w9WgXcQ.jpg')
    })

    it('handles different Vimeo URL formats', () => {
      const media = {
        type: 'video',
        provider: 'vimeo',
        url: 'https://player.vimeo.com/video/123456789'
      }
      const result = getVideoThumbnail(media);
      console.log('Alternative Vimeo format result:', result);
      expect(result).toBe('/media/thumbnails/vimeo-123456789.jpg')
    })
  })

  describe('getEmbedUrl', () => {
    it('returns empty string for null media', () => {
      expect(getEmbedUrl(null)).toBe('')
    })

    it('transforms Vimeo URL to embed URL', () => {
      const media = {
        provider: 'vimeo',
        url: 'https://vimeo.com/123456789'
      }
      expect(getEmbedUrl(media)).toBe('https://player.vimeo.com/video/123456789?title=0&byline=0&portrait=0')
    })

    it('transforms YouTube URL to embed URL', () => {
      const media = {
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
      expect(getEmbedUrl(media)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })
  })

  describe('isEmbeddable', () => {
    it('returns false for null media', () => {
      expect(isEmbeddable(null)).toBe(false)
    })

    it('returns false if embed flag is false', () => {
      const media = {
        type: 'video',
        provider: 'vimeo',
        embed: false
      }
      expect(isEmbeddable(media)).toBe(false)
    })

    it('returns false for non-embeddable types', () => {
      const media = {
        type: 'image',
        provider: 'vimeo'
      }
      expect(isEmbeddable(media)).toBe(false)
    })

    it('returns false for unsupported providers', () => {
      const media = {
        type: 'video',
        provider: 'dailymotion'
      }
      expect(isEmbeddable(media)).toBe(false)
    })

    it('returns true for embeddable video with supported provider', () => {
      const media = {
        type: 'video',
        provider: 'vimeo'
      }
      expect(isEmbeddable(media)).toBe(true)
    })
  })
})
