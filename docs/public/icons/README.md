# Generating Favicon Files

This site uses SVG favicon files that are converted to PNG formats during the build process.

## Automated Generation (Recommended)

Run the following command to generate all favicon files:

```bash
npm install  # First install dependencies including sharp
npm run generate-favicons
```

This will convert all SVG files in `/docs/public/icons/` to their corresponding PNG formats.

## Source SVG Files

The current SVG files create a simple green circle favicon that can be easily replaced with your custom design:

- `/docs/public/icons/favicon.svg` - Main favicon source (512x512)
- `/docs/public/icons/apple-touch-icon.svg` - For iOS devices (180x180)
- `/docs/public/icons/android-chrome-192x192.svg` - For Android (192x192)
- `/docs/public/icons/android-chrome-512x512.svg` - For Android (512x512)
- `/docs/public/icons/maskable-icon.svg` - For Android adaptive icons (512x512 with padding)

## Generated PNG Files

The script will generate the following PNG files:

- `favicon-16x16.png` - 16×16 pixels favicon
- `favicon-32x32.png` - 32×32 pixels favicon
- `favicon-48x48.png` - 48×48 pixels favicon
- `favicon.png` - 32×32 pixels general-purpose favicon
- `apple-touch-icon.png` - 180×180 pixels for iOS devices
- `android-chrome-192x192.png` - 192×192 pixels for Android
- `android-chrome-512x512.png` - 512×512 pixels for Android
- `maskable-icon.png` - 512×512 pixels for Android adaptive icons

## Customization

To change the favicon design:

1. Edit the SVG files with your preferred design
2. Run `npm run generate-favicons` to regenerate all formats
3. Check that all files have been generated correctly in `/docs/public/icons/`

## Note on ICO Format

This script generates PNG favicons instead of ICO format. Modern browsers support PNG favicons, but if you need ICO format:

1. Visit [Favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your favicon.png file
3. Download the generated ICO file and place it in the icons directory
4. Update the config.mts file to reference the ICO file if needed
