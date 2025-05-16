# Testing Framework for MattFisher.io

This document outlines the testing strategy implemented to diagnose and fix issues with the VitePress site, particularly focusing on thumbnail display problems.

## Testing Tools

### 1. Vitest for Unit Testing

Vitest is used for unit testing Vue components and utility functions. It's integrated with the Vite build system that VitePress uses, making it a perfect fit for this project.

Key files:
- `vitest.config.js` - Configuration for Vitest
- `tests/unit/*.test.js` - Unit test files

### 2. Playwright for E2E Testing

Playwright provides end-to-end testing across multiple browsers. It's used to verify that thumbnails are correctly displayed in the actual browser environment.

Key files:
- `playwright.config.js` - Configuration for Playwright
- `tests/e2e/*.spec.js` - E2E test specifications

### 3. Diagnostic Tools

Custom diagnostic scripts help identify issues in the build process and file structure.

Key files:
- `tests/diagnose-thumbnails.js` - Analyzes thumbnail issues

## Getting Started

### Setup

After cloning the repository, install the dependencies:

```bash
npm install
```

### Running Tests

```bash
# Run unit tests
npm test

# Run unit tests with watch mode
npm run test:watch

# Run unit tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run thumbnail diagnostic
npm run diagnose
```

## Test Coverage

### Unit Tests

- **mediaUtils.js** - Tests path generation for thumbnails, embed URL creation, and embeddable media detection
- **WorkbookGallery.vue** - Tests thumbnail URL generation and component rendering

### E2E Tests

- **thumbnails.spec.js** - Tests thumbnail loading in actual browsers and verifies image responses

## Thumbnail Issue Diagnosis

The testing framework was implemented to diagnose issues with thumbnails not displaying correctly. Common issues include:

1. **Path Inconsistency** - Different parts of the codebase referencing different paths
2. **VitePress Public Directory** - Misunderstanding how VitePress serves files from the public directory
3. **Build Process Issues** - Thumbnails not being copied to the correct location during build

## Recommended Approach

To fix thumbnail issues:

1. Run the diagnostic script to identify path inconsistencies:
   ```bash
   npm run diagnose
   ```

2. Run unit tests to verify component behavior:
   ```bash
   npm test
   ```

3. Run E2E tests to check actual browser behavior:
   ```bash
   npm run test:e2e
   ```

4. Standardize on a single path structure throughout the codebase
5. Ensure thumbnails are generated and stored in the correct location
6. Update all component references to use the standardized path

## Continuous Integration

For CI/CD pipelines, these tests can be integrated into GitHub Actions or other CI systems.

Example GitHub Actions workflow:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: tests/e2e/screenshots/
```
