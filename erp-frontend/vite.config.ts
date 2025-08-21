// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',              // Local binding
    port: 5176,                     // Fixed dev port
    strictPort: true,               // Do not change port automatically
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
    // Ensure HMR client points to the same fixed port
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5176,
    }
  }
})
