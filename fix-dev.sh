#!/bin/bash

# Stop any running VitePress servers
echo "Stopping any running VitePress servers..."
pkill -f "vitepress" || true

# Clear cache 
echo "Clearing VitePress cache..."
rm -rf docs/.vitepress/cache
rm -rf docs/.vitepress/.temp
rm -rf node_modules/.vite

# Remove temp files
echo "Removing temporary files..."
rm -rf node_modules/.cache

# Start VitePress in dev mode
echo "Starting VitePress in dev mode..."
cd /Users/matt/Github/mattfisher.io
npm run docs:dev
