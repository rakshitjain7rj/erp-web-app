// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',              // 👈 Ensures proper local binding
    port: 5176,                     // 👈 Force dev server to use port 5176
    strictPort: true,               // 👈 Use exact port, don't pick another
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      protocol: 'ws',              // 👈 WebSocket protocol for HMR
      host: 'localhost',           // 👈 Must match browser address bar host
      port: 5176,                  // 👈 Match the actual server port
    }
  }
})
