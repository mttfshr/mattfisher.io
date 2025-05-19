# Workbook Immersive Mode Guide

## Overview

The Workbook Immersive Mode is a new feature that provides an enhanced viewing experience for media content in the workbook section. It creates a distraction-free environment for viewing videos and images, with custom controls and a visually appealing interface.

## Features

- Full-screen/expanded viewing experience
- Custom media controls for video content
- Keyboard shortcuts for navigation and control
- Background effects based on media content
- URL state preservation for direct linking to immersive mode
- Technical details display for media information

## How to Use

### Viewing Content in Immersive Mode

1. Navigate to any workbook item with video or image content
2. Click the "Immersive View" button in the top-right corner of the media
3. The content will expand to fill the screen with a custom background effect
4. Use the controls at the bottom to interact with the media
5. Press ESC or click the X button to exit immersive mode

### Keyboard Shortcuts

- **Esc**: Exit immersive mode
- **Space** or **K**: Play/pause video
- **F**: Toggle fullscreen
- **M**: Toggle mute

### Direct Linking

You can directly link to the immersive view of any workbook item by adding `?immersive=true` to the URL. For example:

```
https://mattfisher.io/workbook/obsidian-heart?immersive=true
```

This is useful for sharing specific content in immersive mode.

## Configuration

Workbook items can be configured with specific presentation options in their frontmatter. Here's an example configuration:

```markdown
---
title: Project Title
description: Description
media:
  type: video
  provider: vimeo
  url: https://vimeo.com/123456789
  embed: true
  presentation:
    immersive: true                     # Enable immersive viewing by default
    autoplay: false                     # Autoplay in immersive mode
    loop: true                          # Loop playback in immersive mode
    showControls: true                  # Show custom controls in immersive mode
    backgroundMode: "blurred"           # Background effect (blurred, color, none)
    accentColor: "#3a0088"              # Custom accent color for controls and UI
  technicalDetails:
    tools: ["LZX Vidiot", "Tachyons+"]  # Tools used in creation
    format: "HD 1080p"                  # Output format
    duration: "4:32"                    # Duration (for time-based media)
---
```

### Presentation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `immersive` | Boolean | `true` | Whether immersive mode is enabled for this item |
| `autoplay` | Boolean | `false` | Whether to automatically play the media in immersive mode |
| `loop` | Boolean | `true` | Whether to loop the media when it reaches the end |
| `showControls` | Boolean | `true` | Whether to show custom controls in immersive mode |
| `backgroundMode` | String | `"blurred"` | Background effect type: `"blurred"`, `"color"`, or `"none"` |
| `accentColor` | String | `null` | Custom accent color for UI elements (CSS color value) |
| `startTime` | Number | `0` | Start playback from this time (in seconds) |
| `endTime` | Number | `null` | End playback at this time (in seconds) |

### Technical Details

The `technicalDetails` object allows you to provide additional information about the media that can be displayed in the immersive view:

| Field | Type | Description |
|-------|------|-------------|
| `tools` | Array | List of tools/software used to create the media |
| `format` | String | Output format (e.g., "HD 1080p", "4K", etc.) |
| `duration` | String | Duration of time-based media (e.g., "4:32") |

## Future Enhancements

The Immersive Mode feature is being developed in phases:

### Phase 1 (Current)
- Core immersive viewing experience
- Basic media controls
- Background effects
- Keyboard shortcuts
- URL state preservation

### Phase 2 (Planned)
- Enhanced media controls
- Technical details panel
- User preference persistence
- Progress tracking

### Phase 3 (Planned)
- Relationship visualization
- Related items navigation
- Custom annotations

## Troubleshooting

### The immersive mode button doesn't appear
- Ensure the media type is set to `video` or `image` in the frontmatter
- Check that the media URL is correctly specified

### Video doesn't play in immersive mode
- For Vimeo videos, ensure the URL is in the format `https://vimeo.com/123456789`
- For YouTube videos, ensure the URL is in one of the supported formats
- Check browser console for any errors

### Custom background doesn't appear
- Ensure thumbnails are generated for the video
- Check that the `backgroundMode` option is set correctly
- If using `"color"` mode, ensure a valid `accentColor` is provided

## Feedback

If you have any feedback or suggestions for the Immersive Mode feature, please open an issue on the GitHub repository or contact the site administrator.
