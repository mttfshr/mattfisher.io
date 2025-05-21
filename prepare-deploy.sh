#!/bin/bash

# Update package-lock.json for deployment
echo "Updating package-lock.json..."
npm install

# Clean build files
echo "Cleaning build files..."
rm -rf docs/.vitepress/dist
rm -rf docs/.vitepress/cache

# Run a minimal build to test
echo "Running minimal build..."
npm run prebuild:minimal
npm run docs:build

echo "Build completed. Ready to deploy!"
