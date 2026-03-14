import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        // Function form catches transitive deps correctly
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Aptos ecosystem (largest SDKs)
          if (
            id.includes('@aptos-labs') ||
            id.includes('petra-plugin') ||
            id.includes('@martianwallet') ||
            id.includes('@nightlylabs/aptos')
          ) return 'vendor-aptos';

          // Sui ecosystem
          if (
            id.includes('@mysten') ||
            id.includes('@suiet') ||
            id.includes('@nightlylabs/sui')
          ) return 'vendor-sui';

          // WalletConnect / Web3
          if (
            id.includes('@walletconnect') ||
            id.includes('@web3modal') ||
            id.includes('eventemitter')
          ) return 'vendor-web3';

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
      '@aptos-labs/wallet-adapter-react',
      '@aptos-labs/wallet-adapter-core',
      '@aptos-labs/ts-sdk',
      'petra-plugin-wallet-adapter',
      '@martianwallet/aptos-wallet-adapter',
    ],
  },
})
