import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // All node_modules in a single vendor chunk to prevent
          // circular dependency issues between React and libraries
          // that call React.createContext (wagmi, RainbowKit, recharts)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
    ],
  },
})
