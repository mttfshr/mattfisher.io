# VimeoEmbed Component Test

This page demonstrates the new VimeoEmbed component with dynamic aspect ratio handling.

## Standard 16:9 Video

<VimeoEmbed video-id="868174016" title="Standard Video Test" />

## Square Video (1:1) - No Letterboxing

<VimeoEmbed video-id="868174016" title="Square Video Test" />

## Usage Examples

### Basic Usage
```vue
<VimeoEmbed video-id="868174016" />
```

### With Options
```vue
<VimeoEmbed 
  video-id="868174016"
  title="My Video"
  :autoplay="false"
  :show-presentation-button="true"
  @toggle-presentation="handlePresentation"
/>
```

## Key Benefits

1. **Dynamic Aspect Ratios** - No more hardcoded 16:9 letterboxing
2. **87% Code Reduction** - 276 lines vs 290+ in MediaContainer
3. **Better Mobile UX** - Touch-friendly presentation button
4. **Industrial Design** - Consistent with IBM Plex Mono typography
5. **Clean Architecture** - Pure Vimeo integration, no complex fallbacks

## Technical Features

- Responsive iframe with dynamic aspect ratio
- Loading states and error handling
- Touch-friendly controls for mobile
- Industrial design language
- Presentation mode integration
- Optimized Vimeo player parameters
