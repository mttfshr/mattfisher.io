# Test info

- Name: Thumbnail Display Tests >> workbook item page displays embedded media
- Location: /Users/matt/Github/mattfisher.io/tests/e2e/thumbnails.spec.js:41:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/matt/Github/mattfisher.io/tests/e2e/thumbnails.spec.js:56:44
```

# Test source

```ts
   1 | // tests/e2e/thumbnails.spec.js
   2 | import { test, expect } from '@playwright/test';
   3 |
   4 | test.describe('Thumbnail Display Tests', () => {
   5 |   test('workbook page loads thumbnails', async ({ page }) => {
   6 |     // Navigate to the workbook page
   7 |     await page.goto('/workbook/');
   8 |     
   9 |     // Wait for the page to load
   10 |     await page.waitForSelector('.workbook-gallery');
   11 |     
   12 |     // Check if there are gallery items
   13 |     const galleryItems = await page.$$('.gallery-item');
   14 |     expect(galleryItems.length).toBeGreaterThan(0);
   15 |     
   16 |     // Check for image elements
   17 |     const images = await page.$$('.item-media img');
   18 |     expect(images.length).toBeGreaterThan(0);
   19 |     
   20 |     // Take a screenshot for visual verification
   21 |     await page.screenshot({ path: 'tests/e2e/screenshots/workbook-gallery.png' });
   22 |     
   23 |     // Verify image sources contain the expected path
   24 |     for (const img of images) {
   25 |       const src = await img.getAttribute('src');
   26 |       console.log('Image src:', src);
   27 |       
   28 |       // Check if src is a valid URL
   29 |       expect(src).toBeTruthy();
   30 |       
   31 |       // Log detailed information about broken images
   32 |       if (src) {
   33 |         const response = await page.request.get(src).catch(() => null);
   34 |         if (!response || response.status() !== 200) {
   35 |           console.log(`Broken image: ${src}, status: ${response?.status() ?? 'failed to fetch'}`);
   36 |         }
   37 |       }
   38 |     }
   39 |   });
   40 |
   41 |   test('workbook item page displays embedded media', async ({ page }) => {
   42 |     // Get the first workbook item link
   43 |     await page.goto('/workbook/');
   44 |     await page.waitForSelector('.gallery-item');
   45 |     
   46 |     const firstItemHref = await page.locator('.gallery-item').first().getAttribute('href');
   47 |     
   48 |     // Navigate to the first workbook item
   49 |     await page.goto(firstItemHref);
   50 |     
   51 |     // Check for video embed or image
   52 |     const hasVideoEmbed = await page.locator('.video-embed').count() > 0;
   53 |     const hasImageEmbed = await page.locator('.image-embed').count() > 0;
   54 |     
   55 |     // Either video or image should be present
>  56 |     expect(hasVideoEmbed || hasImageEmbed).toBeTruthy();
      |                                            ^ Error: expect(received).toBeTruthy()
   57 |     
   58 |     // Take a screenshot for visual verification
   59 |     await page.screenshot({ path: 'tests/e2e/screenshots/workbook-item.png' });
   60 |   });
   61 |
   62 |   test('checks all thumbnail image responses', async ({ page }) => {
   63 |     // Navigate to the workbook page
   64 |     await page.goto('/workbook/');
   65 |     
   66 |     // Get all image sources
   67 |     const imgSrcs = await page.$$eval('.item-media img', imgs => imgs.map(img => img.src));
   68 |     
   69 |     // Verify each thumbnail returns a valid response
   70 |     const results = [];
   71 |     
   72 |     for (const src of imgSrcs) {
   73 |       // Only check relative URLs
   74 |       if (src.startsWith('http://localhost') || src.startsWith('/')) {
   75 |         const response = await page.request.get(src).catch(e => ({ error: e.message }));
   76 |         
   77 |         results.push({
   78 |           src,
   79 |           status: response.status ? response.status() : 'error',
   80 |           ok: response.ok ? response.ok() : false,
   81 |           contentType: response.headers ? response.headers()['content-type'] : null,
   82 |           error: response.error
   83 |         });
   84 |       }
   85 |     }
   86 |     
   87 |     // Log all results
   88 |     console.table(results);
   89 |     
   90 |     // Check that we have at least some valid images
   91 |     const validImages = results.filter(r => r.ok);
   92 |     expect(validImages.length).toBeGreaterThan(0);
   93 |     
   94 |     // Log any failed images
   95 |     const failedImages = results.filter(r => !r.ok);
   96 |     if (failedImages.length > 0) {
   97 |       console.log('Failed images:', failedImages);
   98 |     }
   99 |   });
  100 | });
  101 |
```