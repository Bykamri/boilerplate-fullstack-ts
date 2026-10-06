import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Forward /api/* to the Node.js server during development.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  preview: {
    port: 5173,
  },
});
