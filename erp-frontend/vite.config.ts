// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',              // 👈 Ensures proper local binding
    port: 5173,                     // 👈 Optional: force dev server to use this port
    strictPort: false,              // 👈 Will pick another port if 5173 is taken
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
      port: 5173,                  // 👈 Ensure browser can connect to Vite via this port
    }
  }
})
