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
        server.middlewares.use((req, res, next) => {
          if (!req.url || !req.url.includes('__save_ia_report')) {
            next()
            return
          }
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
              const baseSlug = String(payload.filename || `report-${Date.now()}`)
                .replace(/\.(json|txt)$/i, '')
                .replace(/[^a-zA-Z0-9._-]/g, '_')

              const jsonName = `${baseSlug}.json`
              const txtName = `${baseSlug}.txt`

              const jsonPath = path.join(dir, jsonName)
              const txtPath = path.join(dir, txtName)

              const jsonContent =
                typeof payload.content === 'string'
                  ? payload.content
                  : JSON.stringify(payload.content, null, 2)
              fs.writeFileSync(jsonPath, jsonContent, 'utf-8')

              if (payload.txtContent) {
                fs.writeFileSync(txtPath, String(payload.txtContent), 'utf-8')
              }

              let imgPathRelative: string | null = null
              if (payload.imageBase64) {
                const imgDir = path.join(dir, 'img')
                if (!fs.existsSync(imgDir)) {
                  fs.mkdirSync(imgDir, { recursive: true })
                }
                const imgName = `${baseSlug}.jpg`
                const imgPath = path.join(imgDir, imgName)
                const cleanBase64 = String(payload.imageBase64).replace(
                  /^data:image\/\w+;base64,/,
                  ''
                )
                fs.writeFileSync(imgPath, Buffer.from(cleanBase64, 'base64'))
                imgPathRelative = `src/data/ia_reports/img/${imgName}`
              }

              // Atualiza index.json na pasta src/data/ia_reports/
              const indexPath = path.join(dir, 'index.json')
              let indexData: { description: string; reports: unknown[] } = {
                description:
                  'Diretório de relatórios gerados automaticamente pela IA (gemini-3.8-flash) para o acervo Garagem em Miniatura.',
                reports: []
              }
              if (fs.existsSync(indexPath)) {
                try {
                  indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
                } catch {
                  // mantém estrutura padrão
                }
              }
              if (payload.content && typeof payload.content === 'object') {
                const existing = Array.isArray(indexData.reports) ? indexData.reports : []
                indexData.reports = [payload.content, ...existing.slice(0, 99)]
                fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  ok: true,
                  jsonPath: `src/data/ia_reports/${jsonName}`,
                  txtPath: `src/data/ia_reports/${txtName}`,
                  imgPath: imgPathRelative
                })
              )
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
