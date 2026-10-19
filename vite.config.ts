import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      includeAssets: [
        'img/favicon.ico',
        'img/favicon-16x16.png',
        'img/favicon-32x32.png',
        'img/favicon-48x48.png',
        'img/apple-touch-icon.png',
        'img/android-chrome-192x192.png',
        'img/android-chrome-512x512.png',
        'img/logo-garagem.png'
      ],
      manifest: {
        id: './',
        name: 'Garagem em Miniatura',
        short_name: 'GaragemMini',
        description: 'Catálogo interativo e curadoria de 105 veículos em miniatura com IA - PereiraLabs',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0c0e12',
        theme_color: '#0c0e12',
        orientation: 'portrait-primary',
        lang: 'pt-BR',
        categories: ['entertainment', 'lifestyle', 'utilities'],
        icons: [
          {
            src: 'img/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'img/favicon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'img/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: 'img/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'img/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'img/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'img/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
