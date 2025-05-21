#!/bin/bash

# Stop any running VitePress servers
echo "Stopping any running VitePress servers..."
pkill -f "vitepress" || true

# Clean up cache directories
echo "Cleaning up cache..."
rm -rf docs/.vitepress/cache
rm -rf docs/.vitepress/.temp
rm -rf node_modules/.vite
rm -rf node_modules/.cache

echo "Starting VitePress in dev mode..."
cd /Users/matt/Github/mattfisher.io
npm run docs:dev
