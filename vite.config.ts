import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages project site: https://<user>.github.io/honeydo-hq/
  base: process.env.GITHUB_ACTIONS ? '/honeydo-hq/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/bee.svg'],
      manifest: {
        name: 'HoneyDo HQ',
        short_name: 'HoneyDo',
        description: 'Home maintenance, weekend jobs, and shop lists — local first.',
        theme_color: '#1a1612',
        background_color: '#12100e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/bee-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/bee-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/bee-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
