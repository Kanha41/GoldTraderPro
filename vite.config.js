import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/gnews': {
          target: 'https://gnews.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gnews/, '/api/v4')
        },
        '/api/otp': {
          target: 'http://localhost:4000',
          changeOrigin: true
        },
        '/api/kitco-rss': {
          target: 'https://www.kitco.com',
          changeOrigin: true,
          rewrite: () => '/rss/kitconews.xml'
        },
        '/api/reddit': {
          target: 'https://www.reddit.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
          headers: {
            'User-Agent': 'GoldTraderPro/1.0 (gold market news)'
          }
        },
        '/api/cors': {
          target: 'https://api.codetabs.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost')
            const target = url.searchParams.get('url')
            return target
              ? `/v1/proxy?quest=${encodeURIComponent(target)}`
              : '/v1/proxy'
          }
        }
      }
    },
    preview: {
      proxy: {
        '/api/gnews': {
          target: 'https://gnews.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gnews/, '/api/v4')
        },
        '/api/kitco-rss': {
          target: 'https://www.kitco.com',
          changeOrigin: true,
          rewrite: () => '/rss/kitconews.xml'
        },
        '/api/reddit': {
          target: 'https://www.reddit.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
          headers: {
            'User-Agent': 'GoldTraderPro/1.0 (gold market news)'
          }
        },
        '/api/cors': {
          target: 'https://api.codetabs.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost')
            const target = url.searchParams.get('url')
            return target
              ? `/v1/proxy?quest=${encodeURIComponent(target)}`
              : '/v1/proxy'
          }
        }
      }
    }
  }
})
