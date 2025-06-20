# useMediaDimensions Composable

A Vue 3 composable for intelligent media aspect ratio detection and management across the site.

## Features

- **Multi-platform support**: Vimeo, YouTube (extendable)
- **Intelligent caching**: Prevents duplicate API calls
- **Fallback handling**: Image dimension detection for non-video content
- **CSS utilities**: Modern aspect-ratio and legacy padding-bottom support
- **Type classification**: Square, portrait, landscape detection

## Usage

```javascript
import { useMediaDimensions } from '../../composables/useMediaDimensions'

const { 
  aspectRatio, 
  isLoading, 
  aspectRatioType, 
  cssAspectRatio, 
  fetchDimensions 
} = useMediaDimensions()

// Fetch dimensions for a URL
onMounted(() => {
  fetchDimensions('https://vimeo.com/123456', { 
    imageUrl: 'fallback-image.jpg' 
  })
})
```

## Integration Opportunities

### Currently Using
- **PinDetail.vue** ✅ - Dynamic pin modal aspect ratios

### Ready for Refactoring
- **VimeoEmbed.vue** - Can replace existing `fetchVideoInfo` logic
- **WorkbookGallery.vue** - Can consolidate "Vimeo Dimensions Utility" 
- **MediaContainer.vue** - Can enhance with multi-platform support

### Benefits of Migration
- **DRY**: Single source of truth for aspect ratio logic
- **Performance**: Shared caching across components  
- **Consistency**: Unified aspect ratio classification
- **Extensibility**: Easy to add new platforms (Spotify, SoundCloud, etc.)

## Refactoring Example

**Before (VimeoEmbed.vue):**
```javascript
const fetchVideoInfo = async () => {
  const response = await fetch(vimeoOembedUrl)
  const data = await response.json()
  aspectRatio.value = (data.height / data.width) * 100
}
```

**After (using composable):**
```javascript
const { paddingBottomPercent, fetchDimensions } = useMediaDimensions()

onMounted(() => {
  fetchDimensions(`https://vimeo.com/${props.videoId}`)
})
```

## Next Steps

1. **VimeoEmbed refactoring** - Replace custom logic with composable
2. **WorkbookGallery integration** - Consolidate existing dimension system
3. **Platform expansion** - Add Spotify, SoundCloud, etc.
4. **MediaThumbnail enhancement** - Dynamic sizing for all thumbnails
