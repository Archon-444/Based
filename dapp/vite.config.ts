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
          if (!id.includes('node_modules')) return;

          // EVM stack (wagmi + viem + RainbowKit)
          if (
            id.includes('wagmi') ||
            id.includes('viem') ||
            id.includes('@rainbow-me')
          ) return 'vendor-evm';

          // Charts (recharts + d3 deps)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory'))
            return 'vendor-charts';

          // Date utilities
          if (id.includes('date-fns')) return 'vendor-dates';

          // Animation
          if (id.includes('framer-motion')) return 'vendor-animation';

          // React core
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          ) return 'vendor-react';

          if (id.includes('/react/') || id.includes('react-is'))
            return 'vendor-react';
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
