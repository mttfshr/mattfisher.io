# Workbook Presentation Mode Guide

## Overview

The Workbook Presentation Mode is a feature that provides an enhanced viewing experience for media content in the workbook section. It creates a distraction-free environment for viewing videos and images, with custom controls and a visually appealing interface.

## Features

- Full-screen/expanded viewing experience
- Custom media controls for video content
- Keyboard shortcuts for navigation and control
- Background effects based on media content
- URL state preservation for direct linking to presentation mode
- Technical details display for media information

## How to Use

### Viewing Content in Presentation Mode

1. Navigate to any workbook item with video or image content
2. Click the "Presentation Mode" button in the top-left corner of the media
3. The content will expand to fill the screen with a custom background effect
4. Use the controls at the bottom to interact with the media
5. Press ESC or click the X button to exit presentation mode

### Keyboard Shortcuts

- **Esc**: Exit presentation mode
- **Space** or **K**: Play/pause video
- **F**: Toggle fullscreen
- **M**: Toggle mute

### Direct Linking

You can directly link to the presentation view of any workbook item by adding `?presentation=true` to the URL. For example:

```
https://mattfisher.io/workbook/obsidian-heart?presentation=true
```

This is useful for sharing specific content in presentation mode.

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
    enabled: true                     # Enable presentation viewing
    autoplay: false                   # Autoplay in presentation mode
    loop: true                        # Loop playback in presentation mode
    showControls: true                # Show custom controls in presentation mode
    backgroundMode: "blurred"         # Background effect (blurred, color, none)
    accentColor: "#3a0088"            # Custom accent color for controls and UI
  technicalDetails:
    tools: ["LZX Vidiot", "Tachyons+"]  # Tools used in creation
    format: "HD 1080p"                  # Output format
    duration: "4:32"                    # Duration (for time-based media)
---
```

### Minimal Configuration

For a simpler setup, you can use a minimal configuration that relies on defaults:

```markdown
---
media:
  type: video
  provider: vimeo
  url: https://vimeo.com/123456789
  embed: true
  presentation:
    enabled: true
---
```

This minimal configuration will use all the default presentation settings.

### Presentation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `true` | Whether presentation mode is enabled for this item |
| `autoplay` | Boolean | `false` | Whether to automatically play the media in presentation mode |
| `loop` | Boolean | `true` | Whether to loop the media when it reaches the end |
| `showControls` | Boolean | `true` | Whether to show custom controls in presentation mode |
| `backgroundMode` | String | `"blurred"` | Background effect type: `"blurred"`, `"color"`, or `"none"` |
| `accentColor` | String | `null` | Custom accent color for UI elements (CSS color value) |
| `startTime` | Number | `0` | Start playback from this time (in seconds) |
| `endTime` | Number | `null` | End playback at this time (in seconds) |

### Technical Details

The `technicalDetails` object allows you to provide additional information about the media that can be displayed in the presentation view:

| Field | Type | Description |
|-------|------|-------------|
| `tools` | Array | List of tools/software used to create the media |
| `format` | String | Output format (e.g., "HD 1080p", "4K", etc.) |
| `duration` | String | Duration of time-based media (e.g., "4:32") |

## Future Enhancements

The Presentation Mode feature is being developed in phases:

### Phase 1 (Current)
- Core presentation viewing experience
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

### The presentation mode button doesn't appear
- Ensure the media type is set to `video` or `image` in the frontmatter
- Check that the media URL is correctly specified

### Video doesn't play in presentation mode
- For Vimeo videos, ensure the URL is in the format `https://vimeo.com/123456789`
- For YouTube videos, ensure the URL is in one of the supported formats
- Check browser console for any errors

### Custom background doesn't appear
- Ensure thumbnails are generated for the video
- Check that the `backgroundMode` option is set correctly
- If using `"color"` mode, ensure a valid `accentColor` is provided

## Feedback

If you have any feedback or suggestions for the Presentation Mode feature, please open an issue on the GitHub repository or contact the site administrator.