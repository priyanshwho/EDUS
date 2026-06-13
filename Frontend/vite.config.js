import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
      ],

      manifest: {
        name: 'EduSphere',
        short_name: 'EduSphere',
        description: 'Academic Resource Platform for Students and Educators',

        theme_color: '#0F172A',
        background_color: '#FFFFFF',

        display: 'standalone',
        start_url: '/',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Use /index.html — it IS in the precache manifest; bare '/' is not.
        navigateFallback: '/index.html',
        // Don't intercept API calls, auth routes, or static assets with the SW
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/auth\//,
          /\.[a-z]{2,4}$/i,   // files with extensions (.png, .js, .css, etc.)
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: true,
  },

  build: {
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router')
            ) {
              return 'vendor-react'
            }

            if (id.includes('framer-motion')) {
              return 'vendor-framer'
            }

            if (id.includes('lucide')) {
              return 'vendor-lucide'
            }

            return 'vendor'
          }
        },
      },
    },
  },
})
