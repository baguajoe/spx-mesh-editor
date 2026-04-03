import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',   // relative paths for Electron file:// loading
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 8000,

  },
  // Dev server for electron:dev mode
  server: {
    port: 5173,
    strictPort: true,
  },
  // Allow importing local files in desktop mode
  optimizeDeps: {
    exclude: ['electron'],
  },
  define: {
    __DESKTOP__: JSON.stringify(process.env.ELECTRON === 'true'),
  }
});