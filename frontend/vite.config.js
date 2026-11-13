import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'block-env-access',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = (req.url || '').toLowerCase()
          if (
            rawUrl === '/.env' ||
            rawUrl.startsWith('/.env') ||
            rawUrl.includes('/.env') ||
            rawUrl.includes('%2eenv')
          ) {
            res.statusCode = 403
            res.setHeader('Content-Type', 'text/plain')
            res.end('Forbidden: Access to environment configuration files is blocked.\n')
            return
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 5173,
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
