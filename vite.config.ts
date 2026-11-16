import { execSync } from 'node:child_process';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// Shown in the dev bar. Falls back so a build outside git still works.
function appVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  // Set BASE_PATH (e.g. /pin-game/) when hosting under a sub-path.
  base: process.env.BASE_PATH ?? '/',
  define: { __APP_VERSION__: JSON.stringify(appVersion()) },
  plugins: [
    // The service worker is off in `pnpm dev` (devOptions.enabled defaults to false).
    VitePWA({
      strategies: 'generateSW',
      // No toast: src/pwa/updater.ts calls updateSW() at a safe moment.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,mp3,woff2,webmanifest,png,svg,ico}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        id: 'pin-game',
        name: 'Pin Game',
        short_name: 'Pin Game',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#34505b',
        background_color: '#1f2f36',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
