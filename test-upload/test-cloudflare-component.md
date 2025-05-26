---
title: Cloudflare Images Component Test
description: Testing the CloudflareImage component integration
layout: workbookItem
---

# Cloudflare Images Component Test

This page tests the CloudflareImage component integration.

## Test 1: Component without hash (should show fallback)

<CloudflareImage 
  imageId="test-image-id"
  alt="Test image"
  width="400"
  height="300"
/>

## Test 2: Component with different variant

<CloudflareImage 
  imageId="another-test-id"
  alt="Test thumbnail"
  variant="thumbnail"
  width="200"
  height="150"
/>

## Test 3: Component with loading states

<CloudflareImage 
  imageId="lazy-test-id"
  alt="Lazy loaded test"
  loading="lazy"
/>

This should demonstrate:
- Component registration is working
- Fallback behavior when hash is not configured
- Error handling for missing images
- Different variant and loading options
