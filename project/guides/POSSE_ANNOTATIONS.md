# POSSE-Style Annotations

This system adds indieweb POSSE-style annotations to your log for tracking content updates across your site, with built-in social media syndication support.

## What are POSSE Annotations?

POSSE (Publish on your Own Site, Syndicate Elsewhere) annotations are simple comment-like log entries that track when content is added or updated on your site. They create a chronological timeline of site activity and prepare content for social media syndication.

Examples:
- Site: `🎬 Added new pottery video` → Social: `New video: pottery`
- Site: `📝 Published thoughts on design systems` → Social: `New post: thoughts on design systems`
- Site: `📌 Bookmarked interesting article` → Social: `Interesting article worth sharing`

## Storage Location

Annotations are stored separately from regular log entries in `docs/log/content-updates.md` to keep them organized and easily manageable.

## Usage

### Command Line
```bash
node scripts/add-annotation.js <category> <content> [link]
```

### NPM Script
```bash
npm run add-annotation <category> <content> [link]
```

### Examples
```bash
# Add a workbook annotation with link
npm run add-annotation workbook "Added new pottery video" /workbook/pottery

# Add a notes annotation  
npm run add-annotation notes "Published thoughts on design systems"

# Add a pins annotation
npm run add-annotation pins "Bookmarked interesting article"
```

## Social Media Syndication

The system automatically creates social media-friendly versions of your annotations:

### Workbook Content
- **Internal**: "Added 'Video Title' video"
- **Syndication**: "New video: Video Title"

### Notes Content  
- **Internal**: "Published 'Post Title' note"
- **Syndication**: "New post: Post Title"

### Pins Content
- **Internal**: "Bookmarked interesting article"
- **Syndication**: "Interesting article worth sharing"

## Categories

- **workbook** - For video/media content additions 🎬
- **notes** - For written content/blog posts 📝  
- **pins** - For bookmarked/saved content 📌
- **general** - For other site updates 📄

## How It Works

1. **Minimal Display**: Annotations appear as subtle, comment-like entries in your log
2. **Automatic Timestamps**: Each annotation is timestamped when created
3. **Visual Icons**: Category-specific icons (🎬📝📌) help identify content types
4. **Optional Links**: Link to the actual content being referenced
5. **Chronological Integration**: Annotations appear in timeline order with regular log entries
6. **Syndication Ready**: Each annotation includes social media-friendly text

## Technical Details

Annotations are stored in `docs/log/content-updates.md` with metadata:

```markdown
---

# 2025-06-21: Added new pottery video

**Type:** annotation
**Category:** workbook
**Timestamp:** 2025-06-21T17:02:34.749Z
**ID:** annotation-1750525354750
**Link:** /workbook/pottery
**Syndication:** New video: pottery

Added new pottery video
```

The LogUpdate component automatically renders these as minimal, comment-like entries with icons and optional links.

## Integration with Workflow

This system works great for:
- **Content Publishing**: Add annotations when publishing new workbook videos or notes
- **Site Updates**: Track when you add new features or update existing content  
- **Bookmark Tracking**: Log when you save interesting content to pins
- **Social Media**: Use the syndication text for posting to Bluesky, Twitter, etc.
- **Development Timeline**: Create a history of site improvements and additions

The result is a comprehensive timeline that shows both your thoughts/updates AND your site activity in one chronological feed, with content ready for social media syndication - true to the indieweb POSSE spirit!
