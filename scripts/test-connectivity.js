#!/usr/bin/env node

/**
 * Phase 2 Connectivity Test for Cloudflare Images Integration
 * 
 * Tests:
 * 1. Environment configuration loading
 * 2. NAS connectivity and file serving
 * 3. Cloudflare API authentication
 * 4. Test image upload to get real Cloudflare Images hash
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConnectivityTester {
  constructor() {
    this.results = {
      environment: { status: 'pending', details: [] },
      nas: { status: 'pending', details: [] },
      cloudflare: { status: 'pending', details: [] },
      testUpload: { status: 'pending', details: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Phase 2 Connectivity Tests\n');
    console.log('=' .repeat(60));
    
    await this.testEnvironment();
    await this.testNasConnectivity();
    await this.testCloudflareApi();
    await this.testImageUpload();
    
    this.printSummary();
  }

  async testEnvironment() {
    console.log('\n📋 Phase 2.1: Environment Configuration Test');
    console.log('-'.repeat(50));
    
    try {
      const requiredVars = [
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_API_TOKEN', 
        'NAS_BASE_URL'
      ];
      
      const missing = [];
      const configured = [];
      
      for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value) {
          missing.push(varName);
        } else {
          configured.push({
            name: varName,
            value: varName.includes('TOKEN') ? `${value.substring(0, 8)}...` : value
          });
        }
      }
      
      if (missing.length > 0) {
        this.results.environment.status = 'failed';
        this.results.environment.details.push(`Missing variables: ${missing.join(', ')}`);
        console.log('❌ Missing required environment variables:', missing.join(', '));
        return;
      }
      
      configured.forEach(({ name, value }) => {
        console.log(`✅ ${name}: ${value}`);
      });
      
      // Validate NAS URL format
      const nasUrl = process.env.NAS_BASE_URL;
      try {
        new URL(nasUrl);
        console.log(`✅ NAS URL format valid: ${nasUrl}`);
      } catch (error) {
        throw new Error(`Invalid NAS URL format: ${nasUrl}`);
      }
      
      this.results.environment.status = 'passed';
      this.results.environment.details.push('All required environment variables configured');
      console.log('✅ Environment configuration test passed');
      
    } catch (error) {
      this.results.environment.status = 'failed';
      this.results.environment.details.push(error.message);
      console.log(`❌ Environment test failed: ${error.message}`);
    }
  }

  async testNasConnectivity() {
    console.log('\n🏠 Phase 2.2: NAS Connectivity Test');
    console.log('-'.repeat(50));
    
    if (this.results.environment.status !== 'passed') {
      console.log('⏭️  Skipping NAS test - environment configuration failed');
      this.results.nas.status = 'skipped';
      return;
    }
    
    try {
      const nasBaseUrl = process.env.NAS_BASE_URL;
      
      console.log(`🔍 Testing connectivity to: ${nasBaseUrl}`);
      
      // Test basic connectivity to NAS
      const testResponse = await fetch(nasBaseUrl, {
        method: 'HEAD',
        timeout: 10000
      });
      
      console.log(`📡 Response status: ${testResponse.status} ${testResponse.statusText}`);
      console.log(`🔗 Response headers:`, Object.fromEntries(testResponse.headers));
      
      if (testResponse.ok || testResponse.status === 404) {
        // 404 is acceptable - means NAS is responding but specific path doesn't exist
        this.results.nas.status = 'passed';
        this.results.nas.details.push(`NAS responding (${testResponse.status})`);
        console.log('✅ NAS connectivity test passed - server is responding');
      } else {
        throw new Error(`Unexpected response: ${testResponse.status} ${testResponse.statusText}`);
      }
      
    } catch (error) {
      this.results.nas.status = 'failed';
      this.results.nas.details.push(error.message);
      console.log(`❌ NAS connectivity test failed: ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log('💡 Tip: Check that your NAS hostname is correct and accessible from your network');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('💡 Tip: Check that the NAS port is correct and the web server is running');
      }
    }
  }

  async testCloudflareApi() {
    console.log('\n☁️  Phase 2.3: Cloudflare API Test');
    console.log('-'.repeat(50));
    
    if (this.results.environment.status !== 'passed') {
      console.log('⏭️  Skipping Cloudflare test - environment configuration failed');
      this.results.cloudflare.status = 'skipped';
      return;
    }
    
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      console.log(`🔍 Testing Cloudflare Images API for account: ${accountId}`);
      
      // Test API authentication by listing images (first page)
      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?per_page=1`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API returned error: ${JSON.stringify(data.errors)}`);
      }
      
      console.log(`✅ API authentication successful`);
      console.log(`📊 Images in account: ${data.result.count || 0}`);
      
      if (data.result.images && data.result.images.length > 0) {
        const sampleImage = data.result.images[0];
        console.log(`📸 Sample image ID: ${sampleImage.id}`);
        console.log(`🔗 Sample image URL: ${sampleImage.variants[0]}`);
      }
      
      this.results.cloudflare.status = 'passed';
      this.results.cloudflare.details.push('API authentication successful');
      this.results.cloudflare.details.push(`Account has ${data.result.count || 0} images`);
      
    } catch (error) {
      this.results.cloudflare.status = 'failed';
      this.results.cloudflare.details.push(error.message);
      console.log(`❌ Cloudflare API test failed: ${error.message}`);
      
      if (error.message.includes('401')) {
        console.log('💡 Tip: Check your CLOUDFLARE_API_TOKEN - it may be incorrect or expired');
      } else if (error.message.includes('403')) {
        console.log('💡 Tip: Check that your API token has Cloudflare Images:Edit permissions');
      }
    }
  }

  async testImageUpload() {
    console.log('\n🖼️  Phase 2.4: Test Image Upload');
    console.log('-'.repeat(50));
    
    if (this.results.cloudflare.status !== 'passed') {
      console.log('⏭️  Skipping image upload test - Cloudflare API test failed');
      this.results.testUpload.status = 'skipped';
      return;
    }
    
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      console.log('🎨 Creating test image...');
      
      // Create a simple test image (1x1 PNG pixel)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      console.log(`📦 Test image size: ${testImageBuffer.length} bytes`);
      
      // Upload to Cloudflare Images
      const formData = new FormData();
      formData.append('file', testImageBuffer, {
        filename: 'connectivity-test.png',
        contentType: 'image/png'
      });
      
      console.log('☁️  Uploading to Cloudflare Images...');
      
      const uploadResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
          body: formData
        }
      );
      
      console.log(`📡 Upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(`Upload API error: ${JSON.stringify(uploadResult.errors)}`);
      }
      
      const imageData = uploadResult.result;
      console.log(`✅ Upload successful!`);
      console.log(`🆔 Image ID: ${imageData.id}`);
      console.log(`🔗 Image URL: ${imageData.variants[0]}`);
      console.log(`📅 Upload date: ${imageData.uploaded}`);
      
      // Extract hash from URL for .env configuration
      const urlParts = imageData.variants[0].split('/');
      const hash = urlParts[urlParts.length - 3]; // Hash is before variant and image ID
      console.log(`🔑 Hash for .env: ${hash}`);
      
      this.results.testUpload.status = 'passed';
      this.results.testUpload.details.push(`Image uploaded successfully: ${imageData.id}`);
      this.results.testUpload.details.push(`Cloudflare Images hash: ${hash}`);
      this.results.testUpload.details.push(`Public URL: ${imageData.variants[0]}`);
      
      // Update .env file if needed
      const currentHash = process.env.VITE_CLOUDFLARE_IMAGES_HASH;
      if (currentHash !== hash) {
        console.log(`\n💡 Update your .env file:`);
        console.log(`   VITE_CLOUDFLARE_IMAGES_HASH=${hash}`);
      }
      
    } catch (error) {
      this.results.testUpload.status = 'failed';
      this.results.testUpload.details.push(error.message);
      console.log(`❌ Test image upload failed: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Phase 2 Connectivity Test Results');
    console.log('='.repeat(60));
    
    const testSections = [
      { name: 'Environment Config', key: 'environment' },
      { name: 'NAS Connectivity', key: 'nas' },
      { name: 'Cloudflare API', key: 'cloudflare' },
      { name: 'Test Upload', key: 'testUpload' }
    ];
    
    let allPassed = true;
    
    testSections.forEach(({ name, key }) => {
      const result = this.results[key];
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'skipped': '⏭️',
        'pending': '⏳'
      }[result.status];
      
      console.log(`${statusIcon} ${name}: ${result.status.toUpperCase()}`);
      
      if (result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`   ${detail}`);
        });
      }
      
      if (result.status === 'failed') {
        allPassed = false;
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
      console.log('🎉 Phase 2 Complete: All connectivity tests passed!');
      console.log('✅ Ready to proceed to Phase 3: End-to-End Testing');
    } else {
      console.log('🔧 Phase 2 Issues Detected: Please resolve the failed tests before proceeding');
      console.log('💡 Check the error details above and verify your configuration');
    }
  }
}

// CLI Interface
async function main() {
  const tester = new ConnectivityTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(`❌ Fatal error during connectivity testing: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ConnectivityTester };