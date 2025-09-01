// phycare/frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // 1. Import the plugin

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // 2. Add the plugin here
  ],
  define: {
    global: {},
  },
})