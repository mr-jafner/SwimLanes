import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Single-file build configuration for easy sharing
// Outputs a standalone HTML file with all assets inlined
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Output to separate directory
    outDir: 'dist-single',

    // Inline all assets
    assetsInlineLimit: 100000000, // 100 MB - inline everything

    // Disable CSS code splitting
    cssCodeSplit: false,

    // Single output file (no chunks)
    rollupOptions: {
      output: {
        // Disable manual chunks for single file
        manualChunks: undefined,

        // Single entry point
        inlineDynamicImports: true,
      },
    },

    // Minify for smaller file size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
      },
    },
  },
});
