// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',              // 👈 Ensures proper local binding
    port: 5173,                     // 👈 Optional: force dev server to use this port
    strictPort: true,              // 👈 Will fail if port is taken instead of picking a random one
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
