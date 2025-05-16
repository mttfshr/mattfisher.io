// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '.idea', '.git', '.cache'],
    include: ['./tests/**/*.test.js'],
    alias: {
      '@': path.resolve(__dirname, './docs/.vitepress'),
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './docs/.vitepress'),
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  }
})
