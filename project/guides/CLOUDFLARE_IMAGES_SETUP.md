# Cloudflare Images Integration Setup Guide

This guide walks you through setting up the complete Cloudflare Images integration for your VitePress site.

## Prerequisites

1. **Cloudflare Images Account**: Active Cloudflare account with Images enabled
2. **Synology NAS**: Configured with Web Station serving static files
3. **Node.js Environment**: Project configured with ES modules

## Step 1: Cloudflare Setup

### 1.1 Get Cloudflare Credentials

1. **Account ID**: 
   - Go to Cloudflare dashboard
   - Right sidebar → Account ID (copy this)

2. **API Token**:
   - Go to My Profile → API Tokens → Create Token
   - Choose "Custom token"
   - **Account**: Select your account
   - **Permissions**: Cloudflare Images:Edit
   - **Zone Resources**: Include (All zones or specific zone)

3. **Images Hash** (needed for delivery URLs):
   - Go to Cloudflare dashboard → Images
   - Upload a test image
   - Copy the hash from the delivery URL: `https://imagedelivery.net/HASH/id/variant`

### 1.2 Configure Environment

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Add your credentials to `.env`**:
   ```bash
   # Cloudflare Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   VITE_CLOUDFLARE_IMAGES_HASH=your_images_hash_here
   
   # NAS Configuration
   NAS_BASE_URL=http://your-nas-hostname:8080
   # OR alternatively, set hostname and port separately:
   # NAS_HOSTNAME=your-nas-hostname
   # NAS_PORT=8080
   ```

## Step 2: NAS Configuration

Your Synology NAS should be configured to serve images over HTTP. The exact URL will be configured in your `.env` file to keep it private.

**Example setup:**
- **Service**: cloudflare_uploads (nginx)
- **Document root**: Points to your "Cloudflare uploads" folder
- **Port**: 8080 (or your choice)
- **Access URL**: `http://your-nas-hostname:8080/`

**Environment Configuration:**
Add your NAS details to `.env`:
```bash
NAS_BASE_URL=http://your-nas-hostname:8080
```

This keeps your internal network details private and out of the public repository.

## Step 3: Install Dependencies

The required dependencies are already added to `package.json`:

```bash
npm install
```

Key dependencies:
- `form-data`: For multipart uploads to Cloudflare
- `gray-matter`: For frontmatter parsing
- `node-fetch`: For HTTP requests

## Step 4: Workflow Overview

### 4.1 Content Creation Workflow

1. **Create content** in Obsidian with NAS image references:
   ```markdown
   ![Project Cover](http://your-nas-hostname:8080/project/cover.jpg)
   ![Detail Shot](http://your-nas-hostname:8080/project/detail.png)
   ```

   **Note**: Use your actual NAS URL as configured in `.env`

2. **Add video URLs** to frontmatter for thumbnail extraction:
   ```yaml
   ---
   title: My Project
   media:
     type: video
     provider: vimeo
     url: https://vimeo.com/123456789
   ---
   ```

3. **Run upload utility** when ready to publish:
   ```bash
   npm run upload-media docs/workbook
   ```

4. **Commit and push** - markdown now has Cloudflare URLs

### 4.2 What the Upload Utility Does

1. **Scans** all `.md` files in specified directory (recursively)
2. **Detects** NAS URLs matching your configured `NAS_BASE_URL`
3. **Downloads** images from your NAS
4. **Uploads** to Cloudflare Images via API
5. **Replaces** NAS URLs with Cloudflare delivery URLs in markdown
6. **Extracts** video thumbnails from Vimeo URLs in frontmatter
7. **Updates** `catalog.json` with all mappings
8. **Reports** summary of uploads and any errors

## Step 5: Usage Examples

### 5.1 Basic Usage

```bash
# Process all workbook files
npm run upload-media docs/workbook

# Process specific subdirectory
npm run upload-media docs/workbook/video-synth-series
```

### 5.2 Testing and Debugging

```bash
# Dry run - preview without making changes
npm run upload-media docs/workbook -- --dry-run

# Verbose logging to see detailed progress
npm run upload-media docs/workbook -- --verbose

# Combined for testing
npm run upload-media docs/workbook -- --dry-run --verbose
```

### 5.3 URL Transformation Example

**Before** (in Obsidian):
```markdown
![Cover Image](http://your-nas-hostname:8080/projects/my-project/cover.jpg)
```

**After** (in repository):
```markdown
![Cover Image](https://imagedelivery.net/abc123def456/789xyz/public)
```

## Step 6: Integration with VitePress

### 6.1 Plugin Integration (Optional)

The VitePress plugin at `docs/.vitepress/plugins/cloudflare-images.js` provides:
- Build-time validation of image URLs
- Warnings for unprocessed NAS URLs
- Catalog loading for components

### 6.2 Vue Component Usage

Use the `CloudflareImage` component for programmatic image display:

```vue
<template>
  <CloudflareImage 
    :image-id="'abc123def456'"
    alt="Project cover"
    width="800"
    height="600"
    variant="public"
  />
</template>
```

## Step 7: File Structure

After setup, your project will include:

```
~/Github/mattfisher.io/
├── scripts/
│   ├── upload-media.js          # Main upload utility
│   └── README.md                # Upload utility documentation
├── docs/.vitepress/
│   ├── plugins/
│   │   └── cloudflare-images.js # VitePress plugin
│   └── components/
│       └── CloudflareImage.vue  # Vue component
├── catalog.json                 # Media mappings (generated)
├── .env                         # Cloudflare credentials (not committed)
└── .env.example                 # Environment template
```

## Step 8: Testing the Setup

### 8.1 Test NAS Connectivity

```bash
# Verify NAS is serving files (replace with your actual NAS URL)
curl http://your-nas-hostname:8080/test-image.jpg
```

### 8.2 Test Upload Utility

```bash
# Run dry-run to test without uploading
npm run upload-media docs/workbook -- --dry-run --verbose
```

### 8.3 Test Cloudflare API

The utility will validate your credentials on first run. If you see:
```
❌ Fatal error: Cloudflare credentials not configured
```

Check your `.env` file and credential setup.

## Troubleshooting

### Common Issues

1. **"Directory not found"**
   - Use relative paths: `docs/workbook` not `/full/path/to/workbook`
   - Ensure the directory exists

2. **"Failed to fetch image"**
   - Verify NAS accessibility: `curl http://your-nas-hostname:8080/image.jpg`
   - Check image file exists in NAS "Cloudflare uploads" folder
   - Verify NAS_BASE_URL in `.env` matches your actual NAS URL

3. **"Cloudflare credentials not configured"**
   - Verify `.env` file exists and has correct values
   - Check API token permissions include Cloudflare Images:Edit

4. **"Cloudflare upload failed"**
   - Verify account ID and API token are correct
   - Check Cloudflare Images is enabled on your account
   - Ensure API token hasn't expired

### Debug Commands

```bash
# Check environment variables
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_API_TOKEN

# Test API connectivity
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/images/v1"

# View catalog contents
cat catalog.json | jq
```

## Next Steps

1. **Test the complete workflow** with a sample image
2. **Integrate with your build process** if desired
3. **Update existing workbook items** by running the utility
4. **Enhance components** with additional Cloudflare Images features (variants, transformations)

## Advanced Configuration

### Custom Image Variants

You can create custom variants in Cloudflare Images dashboard for different use cases:
- `thumbnail` - Small preview images
- `hero` - Large banner images  
- `gallery` - Medium gallery images

Then use them in components:
```vue
<CloudflareImage image-id="abc123" variant="thumbnail" />
```

### Batch Processing

For large migrations, process directories incrementally:
```bash
# Process one collection at a time
npm run upload-media docs/workbook/video-synthesis
npm run upload-media docs/workbook/digital-art
npm run upload-media docs/workbook/collaborations
```

This setup provides a robust, automated workflow for managing images in your VitePress site with Cloudflare Images.