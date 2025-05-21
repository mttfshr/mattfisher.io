import { defineConfig } from 'vite';

// This configuration complements the VitePress configuration
export default defineConfig({
  build: {
    // Ensure JavaScript modules are properly built
    assetsInlineLimit: 0, // Disable asset inlining
    rollupOptions: {
      output: {
        // Ensure proper MIME types for modules
        format: 'es',
      },
    },
  },
  server: {
    // Ensure proper MIME types during development
    fs: {
      // Allow serving files from theme directory 
      allow: ['..']
    },
  },
});
