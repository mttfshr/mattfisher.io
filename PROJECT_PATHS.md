# MattFisher.io - PROJECT_PATHS

This document outlines potential development paths and feature ideas for the MattFisher.io project, organized by thematic areas. These represent directions to explore rather than a fixed roadmap, providing options for enhancing the site as it evolves.

## Media Strategy Implementation

### Cloudflare Images Integration

A comprehensive approach to handle all static images and video thumbnails through Cloudflare Images:

#### Key Concepts
- **Unified CDN Delivery**: All images served from Cloudflare's global CDN
- **Automatic Optimization**: Images optimized for different devices and contexts
- **NAS to Web Workflow**: Streamlined process from local storage to web
- **Video Thumbnail Management**: Automated handling of video preview images
- **Component-Based Integration**: Vue components for consistent display

#### Implementation Steps
1. Set up Cloudflare Images account and API access
2. Create image upload utility for local-to-Cloudflare workflow
3. Implement markdown processor for link replacement
4. Develop video thumbnail automation for Vimeo/YouTube
5. Build Vue components for media display

```javascript
// Example: Markdown processor for image uploads and link replacement
const fs = require('fs');
const path = require('path');
const { uploadToCloudflare } = require('./cloudflare-upload');

async function processMarkdownFile(filePath) {
  // Read the markdown file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Load the image catalog
  let catalog = { images: {}, localToRemote: {} };
  if (fs.existsSync(CATALOG_FILE)) {
    catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  }
  
  // Find all image references
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];
  
  // Process each image reference
  for (const match of matches) {
    const [fullMatch, altText, imagePath] = match;
    
    // Skip if it's already a Cloudflare URL
    if (imagePath.includes('imagedelivery.net')) {
      continue;
    }
    
    // Use existing mapping if available
    if (catalog.localToRemote[imagePath]) {
      const remoteUrl = catalog.localToRemote[imagePath];
      
      // Replace the URL in the content
      content = content.replace(
        new RegExp(`!\\[(.*?)\\]\\(${escapeRegExp(imagePath)}\\)`, 'g'),
        `![\\$1](${remoteUrl})`
      );
      
      continue;
    }
    
    // Resolve full path and upload to Cloudflare
    let fullImagePath = resolveImagePath(imagePath, filePath);
    
    // Upload image and update content reference
    try {
      const result = await uploadToCloudflare(fullImagePath);
      const cfUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_HASH}/${result.id}/public`;
      
      // Add to catalog and replace link
      updateCatalog(catalog, imagePath, fullImagePath, result.id, cfUrl);
      content = updateMarkdownLink(content, imagePath, cfUrl);
    } catch (error) {
      console.error(`Error uploading ${fullImagePath}:`, error);
    }
  }
  
  // Save the updated catalog and content
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
  fs.writeFileSync(filePath, content);
  
  return content;
}
```

### Video Thumbnail Automation

System for automatically managing video thumbnails from Vimeo and YouTube:

#### Key Concepts
- **Automatic Extraction**: Video IDs parsed from embedded URLs
- **Thumbnail Retrieval**: Fetching thumbnails from video platforms
- **Cloudflare Upload**: Storing thumbnails in Cloudflare Images
- **Component Integration**: Vue components for consistent thumbnail display
- **Catalog Management**: System for tracking and accessing thumbnails

#### Implementation Steps
1. Implement video ID extraction from markdown and frontmatter
2. Create thumbnail fetching from Vimeo and YouTube APIs
3. Develop Cloudflare Images upload system
4. Build thumbnail catalog for efficient lookup
5. Create Vue components for thumbnail display

```javascript
// Example: Video thumbnail automation plugin
export function videoThumbnailsPlugin() {
  return {
    name: 'video-thumbnails-plugin',
    
    async buildStart() {
      // Load the thumbnail catalog
      const catalogPath = path.resolve(process.cwd(), 'thumbnail-catalog.json');
      let catalog = { thumbnails: {} };
      
      if (fs.existsSync(catalogPath)) {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      }
      
      // Find workbook items with video embeds
      const workbookDir = path.resolve(process.cwd(), 'docs/workbook');
      const mdFiles = fs.readdirSync(workbookDir).filter(file => file.endsWith('.md'));
      
      // Process each file for video embeds
      for (const file of mdFiles) {
        const filePath = path.join(workbookDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter } = matter(content);
        
        // Process Vimeo embeds
        if (frontmatter.media?.provider === 'vimeo' && frontmatter.media?.url) {
          const vimeoId = extractVimeoId(frontmatter.media.url);
          
          if (vimeoId) {
            await processVimeoThumbnail(vimeoId, catalog);
          }
        }
        
        // Process YouTube embeds
        if (frontmatter.media?.provider === 'youtube' && frontmatter.media?.url) {
          const youtubeId = extractYouTubeId(frontmatter.media.url);
          
          if (youtubeId) {
            await processYouTubeThumbnail(youtubeId, catalog);
          }
        }
      }
      
      // Save the updated catalog
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    }
  };
}
```

### Media Component Architecture

Custom Vue components for consistent media display across the site:

#### Key Concepts
- **Unified Presentation**: Consistent display for all media types
- **Provider Abstraction**: Components that handle provider-specific logic
- **Responsive Design**: Adaptable to different screen sizes and contexts
- **Lazy Loading**: Optimized loading for improved performance
- **Variant Support**: Different presentations based on context

#### Implementation Steps
1. Design MediaImage component for Cloudflare Images
2. Create VideoThumbnail component for video previews
3. Enhance MediaContainer for consistent layout
4. Implement responsive behaviors for all components
5. Add support for different variants and sizes

```vue
<!-- Example: MediaImage.vue -->
<template>
  <img 
    :src="imageUrl" 
    :alt="alt" 
    :width="width" 
    :height="height"
    :loading="loading"
    class="media-image"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  imageId: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  loading: {
    type: String,
    default: 'lazy'
  },
  variant: {
    type: String,
    default: 'public'
  }
});

// Cloudflare Images URL construction
const CLOUDFLARE_HASH = import.meta.env.VITE_CLOUDFLARE_IMAGES_HASH;
const imageUrl = computed(() => {
  return `https://imagedelivery.net/${CLOUDFLARE_HASH}/${props.imageId}/${props.variant}`;
});
</script>
```

### NAS-to-Web Workflow

Optimized process for moving content from local NAS storage to the website:

#### Key Concepts
- **Hybrid Workflow**: Work locally in Obsidian, publish to web seamlessly
- **Automatic Uploads**: Image detection and uploading during publish
- **Link Transformation**: Convert local paths to Cloudflare URLs
- **Catalog Management**: Track mappings between local and remote paths
- **Content Synchronization**: Keep local and published content in sync

#### Implementation Steps
1. Create tooling for detecting local NAS references
2. Implement automatic image upload during build process
3. Build path mapping system between NAS and Cloudflare
4. Develop Obsidian integration for smoother workflow
5. Create versioning and synchronization tools

```javascript
// Example: Obsidian-to-Cloudflare workflow script
async function processObsidianToWeb(obsidianDir, webDir) {
  console.log(`Processing content from Obsidian (${obsidianDir}) to web (${webDir})`);
  
  // Get all markdown files
  const files = getMarkdownFiles(obsidianDir);
  
  // For each file that should be published
  for (const file of files) {
    // Check if it has publish:true frontmatter
    const { data: frontmatter, content } = matter.read(file);
    
    if (frontmatter.publish !== true) {
      console.log(`Skipping ${file} - not marked for publishing`);
      continue;
    }
    
    // Determine destination path
    const relativePath = path.relative(obsidianDir, file);
    const destPath = path.join(webDir, relativePath);
    
    console.log(`Publishing ${relativePath} to web`);
    
    // Create directories if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Process the file (upload images, transform links)
    const processedContent = await processMarkdownFile(file);
    
    // Save to destination with processed content
    fs.writeFileSync(destPath, processedContent);
  }
  
  console.log('Publishing complete!');
}
```

## Pins Enhancement Paths

### Temporal Organization Systems

Leveraging time-based metadata to create new ways of organizing and discovering pins:

#### Key Concepts
- **Era-Based Collections**: Automatically identify and group significant time periods
- **Temporal Coincidence**: Surface items pinned within close proximity
- **Timeline Visualization**: Create interactive timelines for exploring pins chronologically
- **"On This Day"**: Dynamic collections showing items from the same calendar day across years
- **Activity Pattern Analysis**: Identify and highlight periods of intense focus on specific topics

#### Implementation Steps
1. Ensure consistent date capture for all pins
2. Add year/month filtering UI components
3. Create basic timeline visualization showing pin density
4. Implement algorithms to identify high-activity periods
5. Develop "On This Day" feature for daily rediscovery
6. Build cross-section analysis between time and content types

```javascript
// Example: Detecting high-activity periods
function detectActivePeriods(pins, windowSize = 30) {
  // Sort pins by date
  const sortedPins = [...pins].sort((a, b) => new Date(a.pinDate) - new Date(b.pinDate));
  
  // Create a sliding window to count pins
  const activePeriods = [];
  
  for (let i = 0; i < sortedPins.length - windowSize; i++) {
    const windowStart = new Date(sortedPins[i].pinDate);
    const windowEnd = new Date(sortedPins[i + windowSize].pinDate);
    
    // If the window is smaller than a threshold days, it's a high-activity period
    const daysDifference = (windowEnd - windowStart) / (1000 * 60 * 60 * 24);
    
    if (daysDifference < 60) { // Less than 60 days for 30 pins means high activity
      activePeriods.push({
        start: windowStart,
        end: windowEnd,
        pins: sortedPins.slice(i, i + windowSize),
        intensity: windowSize / daysDifference
      });
      
      // Skip ahead to avoid overlapping periods
      i += Math.floor(windowSize / 2);
    }
  }
  
  return activePeriods;
}
```

### Enhanced Relationship Systems

Building richer connection mechanisms between pins beyond basic collections:

#### Key Concepts
- **Typed Relationships**: Define specific relationship types (influences, contrasts, extends)
- **Visual Connection Maps**: Create node-graph visualizations of pin relationships
- **Automatic Relationship Suggestions**: Suggest potential connections based on metadata
- **Relationship Strength**: Allow for indicating the strength or importance of connections
- **Bidirectional vs. Directional**: Support both symmetric and directed relationships

#### Implementation Steps
1. Design relationship data model (relationship types, metadata, directionality)
2. Create UI for manually establishing relationships between pins
3. Implement relationship visualization components
4. Build suggestion algorithms for potential relationships
5. Develop tools for filtering and exploring relationship networks

```javascript
// Example: Relationship data model
const relationshipTypes = [
  {
    id: 'influences',
    name: 'Influences/Inspired by',
    description: 'One item influenced or inspired the other',
    directional: true,
    icon: 'lightbulb'
  },
  {
    id: 'similar',
    name: 'Similar to',
    description: 'Items share significant similarities',
    directional: false,
    icon: 'equals'
  },
  {
    id: 'contrasts',
    name: 'Contrasts with',
    description: 'Items represent contrasting approaches or viewpoints',
    directional: false,
    icon: 'contrast'
  },
  {
    id: 'extends',
    name: 'Extends/Continues',
    description: 'One item continues or extends ideas from another',
    directional: true,
    icon: 'arrow-right'
  }
]
```

### Context Enhancement Tools

Mechanisms for capturing and preserving the context around pins:

#### Key Concepts
- **Rich Annotations**: Enhanced note-taking capabilities for pins
- **Context Capture**: Tools for recording why something was pinned
- **Personal Significance Markers**: Ways to indicate personal importance
- **Connection Notes**: Annotations explaining relationships between pins
- **Mental State Tracking**: Optional recording of mood/energy when pinning

#### Implementation Steps
1. Enhance pin notes with rich text or markdown support
2. Add UI for capturing "why I pinned this" context
3. Implement significance markers or rating system
4. Create special fields for documenting connections
5. Build context visualization components

```javascript
// Example: Enhanced pin data structure with context
interface EnhancedPin {
  id: string;
  url: string;
  title: string;
  // ... existing properties
  
  // Enhanced context properties
  context: {
    whyPinned: string;       // Why this was saved
    significance: number;    // 1-5 rating of personal importance
    mood: string;            // Optional mood when pinning
    thoughtProcess: string;  // Thought process around discovery
    relatedThoughts: string; // Free-form related thoughts
  };
  
  connections: Array<{
    targetPinId: string;
    relationshipType: string;
    notes: string;           // Why these items are connected
    strength: number;        // 1-5 strength of connection
  }>;
}
```

## Exploration and Discovery Mechanisms

### Serendipity Engineering

Creating tools that facilitate unexpected but meaningful discoveries:

#### Key Concepts
- **Random Pin Feature**: Simple tool to surface random items for rediscovery
- **Guided Serendipity**: Smart randomization that considers user context
- **Unusual Juxtapositions**: Deliberately presenting contrasting or diverse items
- **Exploration Paths**: Tracking and suggesting paths through the collection
- **Daily Discoveries**: Scheduled surfacing of forgotten content

#### Implementation Steps
1. Implement basic "Random Pin" feature
2. Create "Surprise Me" button with smart selection algorithm
3. Build daily rediscovery notification or feature
4. Develop unusual juxtaposition generator
5. Implement exploration history tracking

```javascript
// Example: Smart random pin selection
function getSmartRandomPin(pins, userContext) {
  // Filter to pins not seen recently
  const notRecentlySeen = pins.filter(pin => 
    !userContext.recentlyViewed.includes(pin.id)
  );
  
  // Weight based on:
  // 1. How long since last viewed (older = higher weight)
  // 2. Personal significance
  // 3. Some truly random factor
  
  const weightedPins = notRecentlySeen.map(pin => {
    const daysSinceView = getDaysSinceLastView(pin.id, userContext);
    const significanceWeight = pin.context?.significance || 1;
    const randomFactor = Math.random() * 2; // Add some true randomness
    
    return {
      ...pin,
      weight: (daysSinceView * 0.5) + (significanceWeight * 2) + randomFactor
    };
  });
  
  // Sort by weight and pick top item
  weightedPins.sort((a, b) => b.weight - a.weight);
  return weightedPins[0];
}
```

### Visual Organization Tools

Systems for spatially organizing pins to create visual relationships:

#### Key Concepts
- **Canvas View**: Free-form 2D space for arranging pins
- **Spatial Collections**: Saving arrangements as named collections
- **Visual Proximity**: Using position to indicate relationship strength
- **Clusters and Groups**: Tools for creating visual clusters
- **Background Context**: Adding annotations or context to the canvas itself

#### Implementation Steps
1. Create draggable pin representation for canvas
2. Implement canvas saving and loading
3. Add tools for grouping and clustering
4. Develop visual indicators for different relationship types
5. Build annotation tools for the canvas itself

```vue
<!-- Example: Canvas component structure -->
<template>
  <div class="pins-canvas" @click="handleCanvasClick">
    <!-- Canvas background with optional grid -->
    <div class="canvas-background" :style="canvasStyles">
      <!-- Background annotations -->
      <div 
        v-for="annotation in canvasAnnotations" 
        :key="annotation.id"
        class="canvas-annotation"
        :style="getAnnotationStyles(annotation)"
      >
        {{ annotation.text }}
      </div>
    </div>
    
    <!-- Draggable pins -->
    <div
      v-for="pin in canvasPins"
      :key="pin.id"
      class="canvas-pin"
      :style="getPinStyles(pin)"
      @mousedown="startDrag(pin.id, $event)"
    >
      <!-- Pin content -->
      <div class="pin-thumbnail">
        <img v-if="pin.imageUrl" :src="pin.imageUrl" :alt="pin.title">
        <div v-else class="pin-icon" :class="getIconClass(pin)"></div>
      </div>
      <div class="pin-title">{{ pin.title }}</div>
    </div>
    
    <!-- Connection lines between pins -->
    <svg class="connections-layer">
      <line
        v-for="connection in connections"
        :key="`${connection.from}-${connection.to}`"
        :x1="getPinCenterX(connection.from)"
        :y1="getPinCenterY(connection.from)"
        :x2="getPinCenterX(connection.to)"
        :y2="getPinCenterY(connection.to)"
        :class="getConnectionClass(connection)"
      />
    </svg>
  </div>
</template>
```

## Workbook Enhancement Paths

### Workbook & Collections Integration Refinements

Following the successful integration of collections within the workbook section, these refinements would further enhance the user experience:

#### Key Concepts
- **Collections Preview in Items Tab**: Display featured collections on the main workbook page to encourage exploration
- **Persistent Tab Preferences**: Store tab selection in localStorage for persistence across visits
- **Animated Tab Transitions**: Add subtle animations between tab switches for a more polished interface
- **Collection Filtering Enhancements**: Improve filtering options in collections for better discovery
- **Related Collections Panel**: Add a "You might also like" panel on collection pages

#### Implementation Steps
1. Create a FeaturedCollectionsPreview component for the items tab
2. Implement localStorage-based tab state persistence
3. Add transition effects between tabs using CSS animations
4. Enhance collection filtering with more dynamic options
5. Build a recommendation system for related collections

```vue
<!-- Example: FeaturedCollectionsPreview.vue -->
<template>
  <div class="featured-collections-preview" v-if="featuredCollections.length">
    <h2>Featured Collections</h2>
    <div class="preview-grid">
      <div 
        v-for="collection in featuredCollections.slice(0, 3)" 
        :key="collection.slug"
        class="preview-card"
      >
        <a 
          :href="`/workbook/#collections`" 
          @click.prevent="navigateToCollection(collection)"
        >
          <div class="preview-image" :style="getBackgroundStyle(collection)">
            <div class="preview-overlay">
              <h3>{{ collection.title }}</h3>
            </div>
          </div>
          <div class="preview-info">
            <p class="preview-count">{{ collection.totalItems }} items</p>
          </div>
        </a>
      </div>
    </div>
    <div class="view-all">
      <a href="/workbook/#collections">View All Collections →</a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  collections: {
    type: Array,
    default: () => []
  }
});

// Filter to featured collections only
const featuredCollections = computed(() => 
  props.collections.filter(c => c.featured).slice(0, 3)
);

// Get background image style
function getBackgroundStyle(collection) {
  if (collection.image) {
    return { backgroundImage: `url(${collection.image})` };
  }
  return { backgroundColor: 'var(--vp-c-bg-alt)' };
}

// Navigate to collection
function navigateToCollection(collection) {
  window.location.href = `/workbook/#collections`;
  // Could also store the selected collection in localStorage
  // to automatically open it after tab switch
  localStorage.setItem('selectedCollection', collection.slug);
}
</script>
```

### Media Presentation Optimization

Creating the ideal viewing context for different media types:

#### Key Concepts
- **Format-Optimized Views**: Tailored presentation for each media type
- **Immersive Mode**: Distraction-free viewing options
- **Contextual Controls**: Media controls designed for specific content
- **Adaptive Layouts**: Layouts that adjust to media characteristics
- **Detail Progressive Disclosure**: Tiered information display based on engagement

#### Enhanced Frontmatter Schema
```markdown
---
title: Project Title
description: Description
date: YYYY-MM-DD
layout: workbookItem
tags: [tag1, tag2]
media:
  type: video
  provider: vimeo
  url: https://vimeo.com/...
  embed: true
  presentation:
    immersive: true                     # Enable immersive viewing by default
    autoplay: false                     # Autoplay in immersive mode
    loop: true                          # Loop playback in immersive mode
    showControls: true                  # Show custom controls in immersive mode
    startTime: 0                        # Start playback from this time (seconds)
    endTime: null                       # End playback at this time (if specified)
    backgroundMode: "blurred"           # Background effect (blurred, color, none)
    accentColor: "#3a0088"              # Custom accent color for controls and UI
  technicalDetails:
    tools: ["LZX Vidiot", "Tachyons+"]  # Tools used in creation
    format: "HD 1080p"                  # Output format
    duration: "4:32"                    # Duration (for time-based media)
  # Added for future relationship features
  related:
    - slug: "another-project"
      relationship: "series"
---
```

#### Implementation Plan

**Phase 1: Core Immersive Mode (MVP)**
1. Update schema & extend existing workbook items
2. Create basic immersive components:
   - `ImmersiveViewer.vue` container
   - Media-specific display components
   - Toggle UI in `WorkbookItem.vue`
3. Implement basic immersive experience:
   - Full-screen/expanded content view
   - Background effects
   - Keyboard shortcuts
   - URL state preservation

**Phase 2: Enhanced Media Controls**
1. Develop custom controls:
   - Create `ImmersiveControls.vue` with play/pause, volume, progress
   - Implement media-specific controls
   - Add auto-hide behavior for controls
2. Add technical details panel
3. Implement preferences persistence

**Phase 3: Relationship Visualization**
1. Create related items component
2. Update data processing for relationships 
3. Design relationship UI

### Creative Context Presentation

Tools for presenting the context around creative works:

#### Key Concepts
- **Process Documentation**: Ways to show the creation process
- **Influence Mapping**: Visualizing influences on creative work
- **Technical Details Integration**: Elegant presentation of technical metadata
- **Series and Evolution**: Tools for showing how works evolve over time
- **Inspiration Collections**: Connected pins that influenced the work

#### Relationship Model for Creative Works

```javascript
// Relationship types for creative works
const relationshipTypes = [
  {
    id: 'series',
    name: 'Series',
    description: 'Items that are part of the same series or collection',
    directional: false,
    icon: 'collection'
  },
  {
    id: 'influence',
    name: 'Influence',
    description: 'One item influenced or inspired another',
    directional: true,
    icon: 'lightbulb'
  },
  {
    id: 'iteration',
    name: 'Iteration',
    description: 'Items that represent versions or iterations of the same work',
    directional: true,
    icon: 'layers'
  },
  {
    id: 'technique',
    name: 'Technique',
    description: 'Items that share the same technical approach or style',
    directional: false,
    icon: 'tool'
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    description: 'Items created with the same collaborators',
    directional: false,
    icon: 'users'
  }
];
```

#### Implementation Steps
1. Design process documentation components
2. Create influence visualization system
3. Implement technical metadata displays
4. Build series/evolution presentation tools
5. Develop connection system between pins and workbook items

## Next Steps Evaluation Matrix

When considering which paths to pursue next, this matrix can help evaluate options:

| Path | Value | Complexity | Dependencies | Fun Factor | Priority |
|------|-------|------------|--------------|------------|----------|
| Media Strategy Implementation | High | Medium | Low | Medium | 🌟🌟🌟🌟🌟 |
| Workbook Collections | High | Medium | Low | High | 🌟🌟🌟🌟 |
| Temporal Collections | High | Medium | Low | High | 🌟🌟🌟 |
| Enhanced Relationships | High | High | Medium | High | 🌟🌟🌟 |
| Context Tools | Medium | Low | Low | Medium | 🌟🌟 |
| Serendipity Features | Medium | Low | Low | High | 🌟🌟🌟 |
| Visual Organization | High | High | Medium | High | 🌟🌟 |
| Media Presentation | High | Medium | Low | High | 🌟🌟🌟🌟 |
| POSSE Implementation | Medium | High | High | Medium | 🌟 |

This document will evolve as the project progresses and new opportunities emerge. It's designed to capture possibilities rather than prescribe a fixed roadmap, providing inspiration and direction while maintaining flexibility.