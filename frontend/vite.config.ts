/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    assetsDir: 'react-assets',
    rollupOptions: { output: { manualChunks: {
      charts: ['recharts'], react: ['react', 'react-dom', 'react-router'],
    } } },
  },
  test: { setupFiles: ['./src/test-setup.ts'] },
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
})
