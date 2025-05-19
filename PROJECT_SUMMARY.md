# MattFisher.io Project Summary

## Project path: '~/Github/mattfisher.io/'

## Context Continuity

This document serves as a "crib note" for Claude in each new conversation. Due to conversation context limits, Claude cannot access previous conversations, so this document maintains continuity across sessions.

**Instructions for Claude:**
1. Always refer to this document at the beginning of a new conversation
2. Update memory with the project path and context
3. Update this document when approaching context limits
4. Alert Matt when context limits are about to be reached
5. Prioritize information in the "Current Task" section when resuming work
6. Do not suggest changes to the document structure or content
7. The Next task to work on is always the first item in the "Next Steps" section
8. Confirm that you understand the instructions and are ready to proceed

**Instructions for Matt:**
1. Share this document at the start of each new conversation
2. Ask Claude to update the "Current Task" and "Session Notes" sections when nearing context limits

## Current Task

**Working on:** Collections Integration in Workbook Section
**Status:** Completed Initial Implementation
**Progress:**
- ✅ Fixed year frontmatter display in workbook items
- ✅ Enhanced workbook item component to display year correctly
- ✅ Simplified workbook item markdown files structure
- ✅ Designed structured tagging system with key:value pairs
- ✅ Created comprehensive plan for tag-driven collections
- ✅ Designed collection components architecture
- ✅ Created collection visualization and filtering system
- ✅ Integrated collections within workbook section
- ✅ Implemented tabbed navigation between items and collections
- ✅ Created full-width layout for workbook and collection pages

**Implementation Details:**
- Moved collections directory from `/docs/collections` to `/docs/workbook/collections`
- Updated navigation to remove collections as top-level item
- Created WorkbookPage.vue component for tabbed interface
- Implemented URL fragment navigation (#collections)
- Added breadcrumb navigation in collection pages
- Created automatic file copying mechanism for collection files
- Fixed layout and rendering issues with Vue components
- Added detailed error handling and debugging information

## Next Steps

### 1. Implement Tag-Driven Collections System
- ✅ Create collections directory for tag-query based collections
- ✅ Add tag parsing functionality to config.mts
- ✅ Implement collection processing to match items based on tags
- ✅ Create CollectionLayout.vue component with grouping functionality
- ✅ Update workbook items with structured tags (key:value format)

### 2. Create Collection Components
- ✅ Create StructuredTagsDisplay.vue for organized tag presentation
- ✅ Develop TagFilter.vue for advanced workbook filtering
- ✅ Build CollectionsGallery.vue for browsing collections
- ✅ Create TagVisualization.vue for tag relationship visualization
- ✅ Update WorkbookViewer.vue to display structured tags

### 3. Enhance Workbook & Collections Integration
- Add FeaturedCollectionsPreview component to the Items tab
- Implement localStorage-based tab state persistence
- Add transition effects between tabs using CSS animations
- Enhance collection filtering with more dynamic options
- Build a recommendation system for related collections

### 4. Improve Relationship Handling
- Implement enhanced related works functionality
- Create clearer relationship visualization
- Enable browsing by relationships between works

### 4. Enhance Workbook Components
- Update WorkbookViewer.vue to display structured tags
- Create new filtering components for tags and collections
- Improve visualization of work status and relationships

### 5. Maintain Project Documentation
- Create documentation for new metadata schema
- Update examples for workbook items with new frontmatter
- Document collections system for future reference
- Use new session archiving system for PROJECT_SUMMARY

## Session Notes

**Note**: Only the 5 most recent sessions are kept here. Older sessions are archived in `docs/log/entries.md`.

### May 18, 2025 - Session 38 Summary
- Integrated collections within the workbook section rather than as a separate top-level navigation item
- Created tab-based interface in the workbook section for navigating between "All Items" and "Collections"
- Implemented a full-width layout for workbook pages to better display visual content
- Created a dedicated WorkbookPage component to handle the tabbed interface
- Added URL fragment navigation for direct linking to tabs (#collections)
- Implemented breadcrumb navigation in collection pages for better orientation
- Added automatic collection file copying to ensure proper migration from old to new structure
- Fixed layout and rendering issues with Vue components
- Updated PROJECT_PATHS with ideas for future enhancements to the collections system
- Added new task section in PROJECT_SUMMARY for Workbook & Collections Integration enhancements

### May 18, 2025 - Session 37 Summary
- Designed comprehensive tag-driven collections system:
  - Created structured tag parsing with key:value format (type:video, tech:video-synth, etc.)
  - Developed automatic collection membership based on tag queries
  - Implemented grouping within collections (by project, type, medium, etc.)
  - Designed visualization for tag relationships and connections
- Created collection components:
  - StructuredTagsDisplay.vue for organized tag presentation
  - TagFilter.vue for advanced workbook filtering
  - CollectionsGallery.vue for browsing collections
  - TagVisualization.vue for tag relationship visualization
- Updated WorkbookViewer to incorporate structured tags
- Reimagined collections approach to focus on dynamic organization:
  - Collections defined by tag queries rather than manual item lists
  - Automatic grouping of items within collections
  - Visual relationship mapping between tags and collections
  - Enhanced discovery through detailed metadata
- Created implementation plan with component structure and data flow
- Created example collection definitions using tag queries
- Updated workbook items with structured tags in key:value format

### May 17, 2025 - Session 36 Summary
- Fixed issue with year metadata in workbook items:
  - Added the year property to getWorkbookItems function in config.mts
  - Updated WorkbookViewer component to display year metadata
  - Fixed infinite loop issue in WorkbookViewer by removing Content component
- Designed enhanced metadata system for workbook items:
  - Created structured tagging system with key:value pairs
  - Designed flexible schema for categorizing work by status
  - Created approach for organizing works into collections
- Developed collections system:
  - Designed separate collections markdown files approach
  - Created template for collection metadata and item relationships
  - Planned implementation of CollectionLayout component
  - Designed clean integration with existing workbook item structure
- Developed relationship visualization:
  - Designed system to represent different types of relationships
  - Created approach for bidirectional relationships between works
  - Planned UI for navigating related works
- Used software-specific metadata for video synth works:
  - Added Max/MSP and Vsynth tags for accurate process documentation
  - Revised technical details to match actual workflow
  - Created consistent terminology for digital video synthesis techniques

### May 17, 2025 - Session 35 Summary
- Renamed "Immersive Mode" to "Presentation Mode" for better user experience
  - Addressed potential confusion between immersive mode and Vimeo's fullscreen
  - Created more distinctive visual language for the feature
  - Positioned the button in top-left to avoid conflict with player controls
  - Updated all related components and documentation
- Implemented better component architecture
  - Created dedicated MediaContainer.vue component
  - Renamed ImmersiveViewer.vue to PresentationViewer.vue
  - Improved loading and error states for media content
  - Enhanced responsive design for mobile devices
- Added video playback enhancements
  - Implemented progress bar/scrubber with seeking functionality
  - Added time display showing current position and duration
  - Fixed volume slider functionality with embedded videos
  - Added volume initialization for Vimeo players
  - Enhanced volume control slider with improved visuals
  - Fixed default muted state issue with Vimeo videos
  - Fixed reference errors by properly accessing props
- Added casting to TV capability for Vimeo videos
  - Implemented Chromecast integration using Vimeo's API
  - Added postMessage fallbacks for when direct API isn't available
  - Created visual indicators for casting status
  - Added automatic detection of casting availability
- Simplified frontmatter schema for better usability
  - Changed "immersive" parameter to "enabled"
  - Made "blurred" the default background mode
  - Created minimal configuration option with sensible defaults
  - Added example with minimal frontmatter configuration
  - Updated documentation to explain default values
- Created comprehensive documentation in PRESENTATION_MODE_GUIDE.md
  - Updated instructions and screenshots
  - Clarified differences from native player controls
  - Documented keyboard shortcuts and URL parameters

### May 17, 2025 - Session 34 Summary
- Fixed styling issues with DebugLayout affecting site-wide appearance
  - Added `scoped` attribute to prevent global style leakage
  - Made selector more specific with `.debug-layout .content`
  - Fixed white background affecting entire site
- Updated WorkbookItemView layout to prioritize media content
  - Media now appears at top of view with title and descriptive text below
  - Enhanced media presentation with better styling and visual hierarchy
  - Added visual separation between media and content sections
  - Improved responsive behavior for all screen sizes
- Refined WorkbookViewer component with similar media-first approach
  - Restructured layout to match the updated WorkbookItemView pattern
  - Made typography and text elements more subtle
  - Reduced heading sizes and font weights throughout
  - Optimized spacing and visual hierarchy
  - Improved mobile responsiveness with adjusted font sizes
- Added unified styling patterns across workbook components
  - Consistent spacing and visual treatment for related items
  - Harmonized technical details and metadata sections
  - Improved shadow and border radius on media elements