import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure output matches Program.cs
    sourcemap: true // Optional, for debugging
  },
  server: {
    port: 5173, // Only used in dev mode, ignored when built
    proxy: {
      '/test-root': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/test-root/, '/test-root')
      }
    }
  }
});