import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev
export default defineConfig({
  base: '/garagem-miniatura/',
  plugins: [
    react(),
    {
      name: 'ia-reports-writer',
      configureServer(server) {
        server.middlewares.use('/__save_ia_report', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const dir = path.resolve(process.cwd(), 'src/data/ia_reports')
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
              }
              const safeName = String(payload.filename || `report-${Date.now()}.json`).replace(
                /[^a-zA-Z0-9._-]/g,
                '_'
              )
              const targetPath = path.join(dir, safeName)
              const content =
                typeof payload.content === 'string'
                  ? payload.content
                  : JSON.stringify(payload.content, null, 2)
              fs.writeFileSync(targetPath, content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: `src/data/ia_reports/${safeName}` }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ ok: false, error: String(err) }))
            }
          })
        })
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'Garagem em Miniatura',
        short_name: 'GaragemMini',
        description: 'Controlador e catálogo para réplicas automotivas em miniatura',
        theme_color: '#242424',
        background_color: '#242424',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
