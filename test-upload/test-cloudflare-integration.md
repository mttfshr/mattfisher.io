---
title: Test Cloudflare Integration
description: Test file for validating NAS to Cloudflare Images workflow
year: 2025
sidebar: false
tags:
  - 'type:test'
  - 'tech:cloudflare'
  - 'status:test'
media:
  type: video
  provider: vimeo
  url: 'https://vimeo.com/684505621'
  embed: true
  presentation:
    enabled: true
  thumbnail: >-
    https://imagedelivery.net/S8BTb48LSulaEJtfMH0J6Q/75ee441f-c35c-431d-11c8-3e5030760d00/public
---

<ClientOnly>
  <WorkbookViewer />
</ClientOnly>

This is a test file to validate the Cloudflare Images integration workflow.

## Test Images from NAS

Here are some test images that should be processed by the upload utility:

![Test Image 1](http://2751fruitvale.synology.me:8080/test-images/sample-1.jpg)

![Test Image 2](http://2751fruitvale.synology.me:8080/test-images/sample-2.png)

These images will be:
1. Detected by the NAS URL pattern
2. Downloaded from the NAS
3. Uploaded to Cloudflare Images
4. URLs replaced with Cloudflare delivery URLs
5. Added to the catalog.json for tracking

The video above should also have its thumbnail extracted and uploaded to Cloudflare.

<script setup>
import WorkbookViewer from '../.vitepress/theme/components/workbook/WorkbookViewer.vue';
</script>
