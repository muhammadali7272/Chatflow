import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind v4 is wired via PostCSS (see postcss.config.js), not the
// @tailwindcss/vite plugin — the Vite plugin's CSS transform doesn't run in
// Vite 8's rolldown build, which broke `npm run build`.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
