import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Output directory for production build
    outDir: 'dist',

    // Source maps for production debugging
    sourcemap: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            'lucide-react',
            'sonner',
          ],

          // Utility libraries
          'utils-vendor': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'tailwindcss-animate',
            'next-themes',
          ],

          // Future: Add these when implemented
          // 'konva-vendor': ['react-konva', 'konva'],
          // 'sql-vendor': ['sql.js'],
        },
      },
    },
  },
});
