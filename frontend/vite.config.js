// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tagger()],
  build: {
    outDir: "build",
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@components': path.resolve('./src/components'),
      '@pages': path.resolve('./src/pages'),
      '@assets': path.resolve('./src/assets'),
      '@constants': path.resolve('./src/constants'),
      '@styles': path.resolve('./src/styles'),
    },
  },
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],

    proxy: {
      // Setiap permintaan yang dimulai dengan '/api'
      '/api': {
        // Akan diarahkan ke server backend Anda di port 3000
        target: 'http://localhost:3000',
        // Wajib untuk mengubah origin header
        changeOrigin: true,
      },
    }
  }
});
