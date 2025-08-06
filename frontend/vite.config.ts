import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Optimize for users with slower connections
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'clsx']
        }
      }
    },
    // Target modern browsers for better performance
    target: 'es2020',
    // Enable source maps for debugging
    sourcemap: true
  },
  server: {
    port: 3000,
    host: true, // Listen on all addresses for mobile testing
  },
  // Environment variables configuration
  envPrefix: 'VITE_',
  define: {
    // Ensure process.env works in production
    'process.env': {}
  }
})