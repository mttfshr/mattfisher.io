#!/bin/bash

# Stop any running VitePress servers
echo "Stopping any running VitePress servers..."
pkill -f "vitepress"

# Clear cache
echo "Clearing VitePress cache..."
rm -rf docs/.vitepress/cache
rm -rf docs/.vitepress/.temp
rm -rf node_modules/.vite

# Start VitePress with debugging enabled
echo "Starting VitePress with debugging enabled..."
export DEBUG=vitepress:* 
npm run docs:dev
