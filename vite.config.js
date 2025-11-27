
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps in production for security
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Development server configuration
  server: {
    port: 3025,
    host: true,
    hmr: {
      host: '3025-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      protocol: 'wss',
    },
    allowedHosts: [
      '3001-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3002-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3003-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3004-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3005-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3009-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3013-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3017-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3021-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer',
      '3025-ie47i6tvelb2uxnkqkh0i-9344a37e.manusvm.computer'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/t': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/p': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/q': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },


  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@config': path.resolve(__dirname, './src/config')
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
