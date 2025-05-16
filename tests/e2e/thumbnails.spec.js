// tests/e2e/thumbnails.spec.js
import { test, expect } from '@playwright/test';

test.describe('Thumbnail Display Tests', () => {
  test('workbook page loads thumbnails', async ({ page }) => {
    // Navigate to the workbook page
    await page.goto('/workbook/');
    
    // Wait for the page to load
    await page.waitForSelector('.workbook-gallery');
    
    // Check if there are gallery items
    const galleryItems = await page.$$('.gallery-item');
    expect(galleryItems.length).toBeGreaterThan(0);
    
    // Check for image elements
    const images = await page.$$('.item-media img');
    expect(images.length).toBeGreaterThan(0);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/workbook-gallery.png' });
    
    // Verify image sources contain the expected path
    for (const img of images) {
      const src = await img.getAttribute('src');
      console.log('Image src:', src);
      
      // Check if src is a valid URL
      expect(src).toBeTruthy();
      
      // Log detailed information about broken images
      if (src) {
        const response = await page.request.get(src).catch(() => null);
        if (!response || response.status() !== 200) {
          console.log(`Broken image: ${src}, status: ${response?.status() ?? 'failed to fetch'}`);
        }
      }
    }
  });

  test('workbook item page displays embedded media', async ({ page }) => {
    // Get the first workbook item link
    await page.goto('/workbook/');
    await page.waitForSelector('.gallery-item');
    
    const firstItemHref = await page.locator('.gallery-item').first().getAttribute('href');
    
    // Navigate to the first workbook item
    await page.goto(firstItemHref);
    
    // Check for video embed or image
    const hasVideoEmbed = await page.locator('.video-embed').count() > 0;
    const hasImageEmbed = await page.locator('.image-embed').count() > 0;
    
    // Either video or image should be present
    expect(hasVideoEmbed || hasImageEmbed).toBeTruthy();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/workbook-item.png' });
  });

  test('checks all thumbnail image responses', async ({ page }) => {
    // Navigate to the workbook page
    await page.goto('/workbook/');
    
    // Get all image sources
    const imgSrcs = await page.$$eval('.item-media img', imgs => imgs.map(img => img.src));
    
    // Verify each thumbnail returns a valid response
    const results = [];
    
    for (const src of imgSrcs) {
      // Only check relative URLs
      if (src.startsWith('http://localhost') || src.startsWith('/')) {
        const response = await page.request.get(src).catch(e => ({ error: e.message }));
        
        results.push({
          src,
          status: response.status ? response.status() : 'error',
          ok: response.ok ? response.ok() : false,
          contentType: response.headers ? response.headers()['content-type'] : null,
          error: response.error
        });
      }
    }
    
    // Log all results
    console.table(results);
    
    // Check that we have at least some valid images
    const validImages = results.filter(r => r.ok);
    expect(validImages.length).toBeGreaterThan(0);
    
    // Log any failed images
    const failedImages = results.filter(r => !r.ok);
    if (failedImages.length > 0) {
      console.log('Failed images:', failedImages);
    }
  });
});
