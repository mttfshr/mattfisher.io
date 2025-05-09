# Obsidian + VitePress Quick Start Guide

This guide explains how to use Obsidian for writing and managing content for your VitePress site.

## Getting Started

1. **Create a new Obsidian vault**:
   - Point it to the `/docs` folder in your VitePress project
   - This allows you to edit all your Markdown files in place

2. **Enable Core Plugins**:
   - Templates
   - Properties (for frontmatter)
   - YAML frontmatter 

3. **Configure Templates**:
   - Set the template folder location to `/docs/templates` in Obsidian settings

## Creating New Content

### Using Templates

1. Use the template button in Obsidian or use the hotkey (usually `Ctrl/Cmd+T`)
2. Select the appropriate template:
   - `workbook-template.md` for workbook entries
   - `note-template.md` for notes
   - `video-template.md` for video entries

3. Save the file to the correct folder:
   - `/docs/workbook/your-new-entry.md` for workbook entries
   - `/docs/notes/your-new-note.md` for notes

### Important Naming Conventions

- Use kebab-case for file names (e.g., `new-project-name.md` not `New Project Name.md`)
- This ensures URLs work correctly with your VitePress configuration

## Editing Frontmatter

The frontmatter (YAML between `---` markers at the top of each file) contains metadata about your content:

- **title**: The title of your content
- **description**: A brief description 
- **date/createdAt/lastModified**: Dates in YYYY-MM-DD format
- **tags**: Categories or keywords (array)
- **media**: Information about embedded media
- **thumbnail**: (Optional) Custom thumbnail image path
- **layout**: The page layout to use (`workbookItem` or `note`)

In Obsidian, you can edit frontmatter using:
1. The Properties view
2. Directly editing the YAML between the `---` markers

## Media Embeds

### Video Embeds with Thumbnails

```yaml
media:
  type: video
  provider: vimeo  # or youtube
  url: https://vimeo.com/your-video-id
  embed: true
thumbnail: /_media/thumbnails/custom-thumbnail.jpg  # Optional: custom thumbnail
```

If you don't specify a thumbnail, the system will try to:
1. Generate one automatically from the video (during build)
2. Use a default video placeholder if generation fails

### Image Embeds

```yaml
media:
  type: image
  url: /_media/your-image.jpg
  embed: true
```

### Audio Embeds

```yaml
media:
  type: audio
  url: /path/to/your-audio-file.mp3
  embed: true
```

## Thumbnail Generation

When you build your site, the system will automatically:
1. Detect all Vimeo and YouTube videos in your workbook entries
2. Fetch thumbnails for these videos
3. Save them to the `/_media/thumbnails/` directory
4. Update your workbook items with the thumbnail paths

If you want to provide your own custom thumbnails, add the `thumbnail` property to your frontmatter:

```yaml
thumbnail: /_media/thumbnails/my-custom-thumbnail.jpg
```

Custom thumbnails take precedence over automatically generated ones.

## Technical Details in Frontmatter

For technical projects, you can add technical specifications:

```yaml
tech:
  - After Effects
  - DaVinci Resolve
  - Blender
specs:
  resolution: 3840×2160 pixels (4K)
  frameRate: 24fps
  duration: 04:18
```

## Testing Your Changes

After editing in Obsidian, preview your changes by running:

```bash
npm run docs:dev
```

This will start the VitePress development server to see your changes live at http://localhost:5173.

## Tips for Working with Obsidian and VitePress

1. **Link Between Content**: Use Markdown links like `[Link Text](/workbook/project-name)` to link between content.

2. **Consistent Formatting**:
   - Use headings (# Heading) to structure your content
   - Use lists (- item) for discrete points
   - Use code blocks (```) for code or technical details

3. **Images**:
   - Store images in `docs/public/_media/`
   - Reference them with absolute paths: `/_media/image-name.jpg`

4. **Folder Organization**:
   - Keep all related assets in a predictable structure
   - Consider using subfolders in `_media` for organization

5. **Publishing Workflow**:
   - Write and edit in Obsidian
   - Preview with VitePress
   - Commit changes to Git
   - Deploy with your preferred method

By using Obsidian with these templates and guidelines, you can maintain a clean, consistent content structure that works seamlessly with your VitePress site.