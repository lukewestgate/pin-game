# PWA facts for Vite and iOS

Type: research
Status: open
Parent: ../map.md
Blocked by: 06

## Question

What facts do the PWA decisions depend on, for a Vite + Babylon.js single-page game? Build on the iOS findings already in `../research/01-engine-options.md` (Home Screen web apps on iOS 26, storage quota and eviction) instead of repeating them. Cover:

- `vite-plugin-pwa`: current version, `generateSW` versus `injectManifest`, precaching a roughly 1 MB bundle plus `data/` JSON, and the update strategies it supports (`autoUpdate` versus `prompt`).
- iOS home-screen quirks for a game: locking to portrait (does the manifest `orientation` work on iOS?), standalone display and the status bar, safe-area insets with `viewport-fit=cover`, stopping double-tap zoom, pinch zoom and pull-to-refresh, long-press callouts and text selection, and the Web Audio unlock on first touch.
- Android Chrome install: what makes the install prompt appear, and maskable icons.
- Static hosting choices for a free hobby project (GitHub Pages, Cloudflare Pages, Netlify): HTTPS, cache headers for the service worker file, deploys from CI, and custom domains.

Findings go in `../research/04-pwa-facts.md`, with sources cited.
