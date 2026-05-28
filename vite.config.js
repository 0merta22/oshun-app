import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api requests are forwarded to Railway by the Vite dev server.
      // This runs server-to-server, so CORS never applies in local dev.
      '/api': {
        target: 'https://oshun-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
