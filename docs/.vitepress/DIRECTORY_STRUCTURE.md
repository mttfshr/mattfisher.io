# VitePress Directory Structure

This document outlines the organization of directories in this VitePress project.

## Directory Structure

```
docs/
├── .vitepress/
│   ├── cache/                  # Cache files and build artifacts
│   ├── theme/                  # Theme customization
│   │   ├── components/         # Vue components
│   │   ├── layouts/            # Page layouts
│   │   ├── composables/        # Vue composition functions
│   │   └── index.js            # Theme entry point
│   ├── public/                 # Static assets directly copied to output
│   ├── scripts/                # Build-time scripts (standalone executables)
│   ├── utils/                  # Utility functions (reusable modules)
│   ├── dist/                   # Build output (generated)
│   └── config.mts              # VitePress configuration
├── public/                     # Public assets (standard VitePress location)
└── [content directories]/      # Markdown content
```

## Scripts vs Utils

The project makes a clear distinction between scripts and utils:

### scripts/
- Standalone executable Node.js scripts
- Typically run directly (e.g., via npm scripts)
- Used for build processes, data generation, or other one-time operations
- Example: `generate-og-cache.js`

### utils/
- Reusable utility functions
- Imported and used by other parts of the codebase
- Provide helper functionality to components, layouts, or scripts
- Example: `getPins.js`

This separation makes it clearer what each file's purpose is and helps with maintainability.
