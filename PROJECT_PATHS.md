# MattFisher.io - PROJECT_PATHS

This document outlines potential development paths and feature ideas for the MattFisher.io project, organized by thematic areas. These represent directions to explore rather than a fixed roadmap, providing options for enhancing the site as it evolves.

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

## Social Integration Paths

### POSSE Implementation

Publish Own Site, Syndicate Elsewhere implementation:

#### Key Concepts
- **Selective Syndication**: Controls for what content gets shared where
- **Origin Markers**: Clear indicators of original source
- **Engagement Aggregation**: Collecting responses across platforms
- **Federated Identity**: Consistent identity across social contexts
- **Protocol-First Approach**: Focusing on protocols rather than platforms

#### Implementation Steps
1. Build Bluesky/AT Protocol integration
2. Create syndication control system
3. Implement webmention support for response collection
4. Develop consistent cross-platform identity presentation
5. Build engagement dashboard showing activity across platforms

### Community Interaction Tools

Systems for meaningful interaction around content:

#### Key Concepts
- **Contextual Discussions**: Discussions tied to specific content
- **Response Integration**: Incorporating external responses
- **Conversation Preservation**: Archiving valuable discussions
- **Attribution System**: Proper credit for contributions and influences
- **Collaboration Capabilities**: Tools for collaborative creation

#### Implementation Steps
1. Design comment/discussion component
2. Build webmention receiver and display
3. Create conversation archiving system
4. Implement attribution mechanisms
5. Develop collaboration features

## Technical Architecture Paths

### Longevity Assurance

Ensuring long-term viability of the system:

#### Key Concepts
- **Format Durability**: Using maximally durable formats
- **Migration Pathways**: Clear paths for future technology transitions
- **Self-Contained Systems**: Minimizing external dependencies
- **Documentation**: Thorough documentation of all systems
- **Regular Exports**: Automated exports in portable formats

#### Implementation Steps
1. Audit and document all data formats
2. Create comprehensive backup system
3. Develop automated export tools
4. Build migration utilities for potential future transitions
5. Document the full system architecture

### Flexibility Enhancements

Making the system more adaptable to future needs:

#### Key Concepts
- **Extensible Data Models**: Schemas that can evolve without breaking
- **Plugin Architecture**: Support for future feature extensions
- **Module Independence**: Ensuring components can evolve independently
- **Progressive Enhancement**: Core functionality that works without advanced features
- **Feature Toggles**: Easy enabling/disabling of experimental features

#### Implementation Steps
1. Design extensible data schemas
2. Create plugin system for future extensions
3. Refactor towards more independent modules
4. Implement feature toggle system
5. Build progressive enhancement approach

## Next Steps Evaluation Matrix

When considering which paths to pursue next, this matrix can help evaluate options:

| Path | Value | Complexity | Dependencies | Fun Factor | Priority |
|------|-------|------------|--------------|------------|----------|
| Temporal Collections | High | Medium | Low | High | 🌟🌟🌟🌟 |
| Enhanced Relationships | High | High | Medium | High | 🌟🌟🌟 |
| Context Tools | Medium | Low | Low | Medium | 🌟🌟 |
| Serendipity Features | Medium | Low | Low | High | 🌟🌟🌟 |
| Visual Organization | High | High | Medium | High | 🌟🌟 |
| Media Presentation | High | Medium | Low | High | 🌟🌟🌟🌟🌟 |
| POSSE Implementation | Medium | High | High | Medium | 🌟 |

This document will evolve as the project progresses and new opportunities emerge. It's designed to capture possibilities rather than prescribe a fixed roadmap, providing inspiration and direction while maintaining flexibility.

# Workbook Metadata and Collections Implementation Plan

## Tag-Driven Collections System

## Structured Tags System

### Workbook Item with Structured Tags

```yaml
---
title: Obsidian Heart video
description: For "Obsidian Heart" by THEATH and MANNING.
year: 2021
sidebar: false
tags:
  - type:video
  - medium:digital
  - tech:video-synth
  - tool:max-msp
  - tool:jitter
  - status:completed
  - project:abstract-hymns
  - collab:theath-manning
media:
  type: video
  provider: vimeo
  url: https://vimeo.com/684505621
  embed: true
  presentation:
    enabled: true
  technicalDetails:
    tools: ['Max/MSP', 'Jitter', 'Custom video synthesis patches']
    format: 'HD Video (1920x1080)'
    duration: '4:36'
---
```

### Standard Tag Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `type` | Fundamental medium or format | `type:video`, `type:installation`, `type:software` |
| `medium` | Physical or digital material | `medium:digital`, `medium:analog`, `medium:mixed` |
| `tech` | Techniques or processes | `tech:video-synth`, `tech:generative`, `tech:collage` |
| `tool` | Software or hardware used | `tool:max-msp`, `tool:processing`, `tool:premiere` |
| `status` | Current state of the project | `status:completed`, `status:in-progress`, `status:concept` |
| `project` | Parent project or series | `project:abstract-hymns`, `project:responsive-environments` |
| `collab` | Collaborator or group | `collab:theath-manning`, `collab:finishing-school` |

## Tag-Driven Collections

### Directory Structure

```
docs/
├── workbook/
│   ├── obsidian-heart.md
│   ├── the-place-where-gods-are-born.md
│   └── ...
├── collections/
│   ├── video-synthesis.md
│   ├── collaborations.md
│   ├── digital.md
│   └── ...
└── ...
```

### Collection Definition with Tag Queries

```yaml
---
title: Video Synthesis Works
description: Experimental video works created with analog and digital synthesis techniques
featured: true
image: /media/collections/video-synthesis-featured.jpg
order: 1
tagQuery:
  includes: 
    - tech:video-synth
  excludes:
    - status:abandoned
groupBy: project
sortBy: year
sortDirection: desc
---

# Video Synthesis Works

This collection showcases my video synthesis projects created using various analog and digital techniques. Video synthesis is a technique that uses electronic processing to generate and manipulate visual imagery without traditional cameras or pre-recorded footage.
```

## Implementation Components

### 1. Core Configuration Functions

```javascript
/**
 * Parse structured tags in the format key:value
 */
function parseTags(tags) {
  const result = {
    type: [],
    tech: [],
    tool: [],
    status: [],
    medium: [],
    project: [],
    collab: [],
    other: []
  };
  
  if (!tags || !Array.isArray(tags)) return result;
  
  tags.forEach(tag => {
    if (typeof tag !== 'string') return;
    
    const [prefix, value] = tag.includes(':') ? tag.split(':', 2) : ['other', tag];
    
    if (result[prefix]) {
      result[prefix].push(value);
    } else {
      result.other.push(tag);
    }
  });
  
  return result;
}

/**
 * Function to gather collections data at build time
 */
function getCollections() {
  const collectionsDir = path.resolve(process.cwd(), 'docs/collections')
  
  // Create the collections directory if it doesn't exist
  if (!fs.existsSync(collectionsDir)) {
    console.log(`Creating collections directory: ${collectionsDir}`)
    fs.mkdirSync(collectionsDir, { recursive: true })
  }
  
  // Get all .md files in the collections directory except index.md
  const files = fs.existsSync(collectionsDir) 
    ? fs.readdirSync(collectionsDir).filter(file => 
        file.endsWith('.md') && file !== 'index.md'
      )
    : []
  
  // Parse each collection file
  const collections = files.map(file => {
    const filePath = path.join(collectionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: description } = matter(content)
    const slug = file.replace(/\.md$/, '')
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      featured: frontmatter.featured || false,
      image: frontmatter.image || '',
      order: frontmatter.order || 999,
      tagQuery: frontmatter.tagQuery || null,
      groupBy: frontmatter.groupBy || null,
      sortBy: frontmatter.sortBy || 'year',
      sortDirection: frontmatter.sortDirection || 'desc',
      path: `/collections/${slug}`,
      content: description,
      lastUpdated: lastModified
    }
  })
  
  // Sort collections by order property
  return collections.sort((a, b) => a.order - b.order)
}

/**
 * Process collections to include their matching items
 */
function processCollections(collections, workbookItems) {
  return collections.map(collection => {
    // If collection doesn't have a tag query, return as is
    if (!collection.tagQuery) {
      return collection;
    }
    
    // Find items matching the tag query
    const matchingItems = workbookItems.filter(item => {
      // Check if item has all required tags
      if (collection.tagQuery.includes) {
        const matches = collection.tagQuery.includes.every(tag => {
          return item.tags.includes(tag);
        });
        
        if (!matches) return false;
      }
      
      // Check if item has any excluded tags
      if (collection.tagQuery.excludes) {
        const hasExcluded = collection.tagQuery.excludes.some(tag => {
          return item.tags.includes(tag);
        });
        
        if (hasExcluded) return false;
      }
      
      return true;
    });
    
    // Group items if groupBy is specified
    let groupedItems = null;
    if (collection.groupBy) {
      groupedItems = {};
      
      sortedItems.forEach(item => {
        const groupValues = [];
        
        // Get grouping values from parsed tags
        if (item.parsedTags && item.parsedTags[collection.groupBy]) {
          groupValues.push(...item.parsedTags[collection.groupBy]);
        } else if (item[collection.groupBy]) {
          // If grouping by a direct property like year
          groupValues.push(item[collection.groupBy]);
        }
        
        // If no group value, add to "Other"
        if (groupValues.length === 0) {
          const otherGroup = groupedItems['Other'] || [];
          otherGroup.push(item);
          groupedItems['Other'] = otherGroup;
        } else {
          // Add to each group
          groupValues.forEach(groupValue => {
            const group = groupedItems[groupValue] || [];
            group.push(item);
            groupedItems[groupValue] = group;
          });
        }
      });
    }
    
    // Return the collection with matched items
    return {
      ...collection,
      items: sortedItems,
      groupedItems,
      totalItems: sortedItems.length
    };
  });
}
```

### 2. Key Vue Components

#### 1. StructuredTagsDisplay.vue
Component to display structured tags organized by category with appropriate styling.

#### 2. CollectionLayout.vue
Dynamic layout for collection pages, displaying items grouped by specified criteria.

#### 3. TagFilter.vue
Advanced filtering component for workbook items with multi-category filtering.

#### 4. TagVisualization.vue
Interactive visualization to explore relationships between tags and categories.

#### 5. CollectionsGallery.vue
Grid display of collections with filtering options and featured collections.

### 3. VitePress Theme Integration

```javascript
// In themeConfig section of config.mts
export default defineConfig({
  // ... existing configuration
  
  themeConfig: {
    // ... existing themeConfig
    
    // Get workbook items first
    workbookItems: getWorkbookItems(),
    
    // Then get and process collections with workbook items
    collections: processCollections(getCollections(), getWorkbookItems()),
  }
})
```
```