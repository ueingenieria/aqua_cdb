import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'mobile' ? '/' : '/cdb/',
  publicDir: mode === 'mobile' ? false : 'public',
  build: { outDir: mode === 'mobile' ? 'dist-mobile' : 'dist' },
  plugins: [
    react(),
    mode === 'mobile' ? {
      name: 'mobile-public-icons',
      generateBundle() {
        for (const fileName of ['app_icon.png', 'pwa-192x192.png', 'pwa-512x512.png']) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL(`./public/${fileName}`, import.meta.url)) });
        }
      },
    } : VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // Desactivar inyección automática para usar firebase-messaging-sw.js manualmente
      includeAssets: ['favicon.ico', 'app_icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'AquaExpress Club',
        short_name: 'AquaExpress',
        description: 'Club de beneficios AquaExpress',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/cdb/',
        scope: '/cdb/',
        gcm_sender_id: '103953800507',
        icons: [
          {
            src: 'app_icon.png',
            sizes: '192x192 512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
}))
