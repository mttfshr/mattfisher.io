# Security Enhancement: Environment Variables for NAS Configuration

## Changes Made

We've moved all NAS-specific URLs and configuration from tracked files to environment variables for better security. This prevents internal network details from being exposed in the public repository.

## Files Updated

### 1. `.env.example`
- Added NAS configuration variables
- Updated with examples and clear documentation
- Includes both direct URL and separate hostname/port options

### 2. `scripts/upload-media.js`
- Added `dotenv` import and configuration loading
- Dynamic NAS URL pattern generation from environment variables
- Configuration validation with helpful error messages
- Shows configured NAS URL during initialization for verification

### 3. `docs/.vitepress/plugins/cloudflare-images.js`  
- Dynamic NAS URL pattern generation from environment variables
- Graceful handling when NAS configuration is missing

### 4. Documentation Files
- `- project/CLOUDFLARE_IMAGES_SETUP.md.md`: Updated all references to use environment variables
- `scripts/README.md`: Updated to reflect environment-based configuration

## Environment Variables Added

```bash
# Primary configuration (recommended)
NAS_BASE_URL=http://your-nas-hostname:8080

# Alternative configuration
NAS_HOSTNAME=your-nas-hostname  
NAS_PORT=8080
```

## Security Benefits

1. **Private Network Details**: Internal hostnames and ports no longer visible in public repo
2. **Flexible Configuration**: Easy to change NAS setup without code changes
3. **Environment-Specific**: Different configurations for development/production
4. **Git-Safe**: `.env` file already in `.gitignore`

## Usage Instructions

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your actual NAS details**:
   ```bash
   # Edit .env with your specific NAS configuration
   NAS_BASE_URL=http://your-actual-nas-hostname:8080
   ```

3. **Use as before**:
   ```bash
   npm run upload-media docs/workbook -- --dry-run
   ```

The upload utility will automatically load the configuration and show the NAS URL being used during initialization.

## Validation

The system includes automatic validation:
- Warns if no NAS configuration is provided
- Shows the configured NAS URL during dry-run for verification  
- Gracefully handles missing environment variables

This enhancement maintains all functionality while improving security and flexibility of the Cloudflare Images integration system.
