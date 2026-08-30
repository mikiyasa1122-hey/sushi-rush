import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    manifest: false,
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,mp3}'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    },
  })],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
