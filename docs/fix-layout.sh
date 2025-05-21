#!/bin/bash

# Stop any running VitePress servers
echo "Stopping any running VitePress servers..."
pkill -f "vitepress" || true

# Clean npm cache for VitePress
echo "Cleaning npm cache for VitePress..."
npm cache clean --force vitepress

# Clear cache directories
echo "Clearing VitePress cache..."
rm -rf docs/.vitepress/cache
rm -rf docs/.vitepress/.temp
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# Fix layout in some files
echo "Setting fallback layout for problematic files..."
sed -i '' 's/layout: note/layout: fallback/g' /Users/matt/Github/mattfisher.io/docs/notes/what-is-this.md
sed -i '' 's/layout: note/layout: fallback/g' /Users/matt/Github/mattfisher.io/docs/notes/another-test.md
sed -i '' 's/layout: simplenote/layout: fallback/g' /Users/matt/Github/mattfisher.io/docs/notes/simplenote-test.md

# Start VitePress in dev mode
echo "Starting VitePress in dev mode..."
cd /Users/matt/Github/mattfisher.io
npm run docs:dev
