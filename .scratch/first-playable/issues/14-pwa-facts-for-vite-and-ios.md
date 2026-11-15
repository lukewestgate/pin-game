# PWA facts for Vite and iOS

Type: research
Status: resolved
Parent: ../map.md
Blocked by: 06

## Question

What facts do the PWA decisions depend on, for a Vite + Babylon.js single-page game? Build on the iOS findings already in `../research/01-engine-options.md` (Home Screen web apps on iOS 26, storage quota and eviction) instead of repeating them. Cover:

- `vite-plugin-pwa`: current version, `generateSW` versus `injectManifest`, precaching a roughly 1 MB bundle plus `data/` JSON, and the update strategies it supports (`autoUpdate` versus `prompt`).
- iOS home-screen quirks for a game: locking to portrait (does the manifest `orientation` work on iOS?), standalone display and the status bar, safe-area insets with `viewport-fit=cover`, stopping double-tap zoom, pinch zoom and pull-to-refresh, long-press callouts and text selection, and the Web Audio unlock on first touch.
- Android Chrome install: what makes the install prompt appear, and maskable icons.
- Static hosting choices for a free hobby project (GitHub Pages, Cloudflare Pages, Netlify): HTTPS, cache headers for the service worker file, deploys from CI, and custom domains.

Findings go in `../research/04-pwa-facts.md`, with sources cited.

## Answer

Full findings: [research/04-pwa-facts.md](../research/04-pwa-facts.md).

- **`vite-plugin-pwa` 2.0.0** (Oct 2026, Workbox 7.4.1, Vite 3–8, Node 20.19+). `generateSW` writes the service worker for you from config, and is enough for precache-only offline play. `injectManifest` is for custom service worker code.
- **Precaching:** by default only `**/*.{js,css,html}`, so JSON imported from TS is bundled and cached, but loose `data/*.json` needs `json` added to `globPatterns` (keep `html` in the list). Files over 2 MiB each are skipped unless `maximumFileSizeToCacheInBytes` is raised.
- **Updates:** `prompt` (the default) gives `onNeedRefresh` plus `updateSW()`. `autoUpdate` forces `skipWaiting` and `clientsClaim` and reloads open tabs, so a level in progress can be lost, and the docs warn that switching modes after launch is painful. Browsers check for updates on navigation and ignore HTTP cache for `sw.js`. Periodic `registration.update()` is documented. Whether iOS checks when it resumes an app from memory is unverified.
- **iOS orientation:** neither the manifest `orientation` nor `screen.orientation.lock()` works on iPhone or iPad (Safari 27 included), so the page must handle landscape itself. Android honours the manifest `orientation`.
- **iOS display:** `standalone` is the only app display mode (`fullscreen` and `minimal-ui` aren't supported). The status bar is controlled only by `apple-mobile-web-app-status-bar-style`. Open WebKit bugs: on iOS 26.1+ the status bar and top safe area are wrong (inset reads 0), and installs without the status-bar tag get the wrong `100vh` until the user reinstalls, so the tag has to be in the first deploy. `theme-color` is unreliable on iOS.
- **iOS gestures:** use `viewport-fit=cover` plus `env(safe-area-inset-*)`. `user-scalable=no` has been ignored since iOS 10, so use `touch-action: none` or `manipulation` instead. `overscroll-behavior` is supported since Safari 16 (Chrome's pull-to-refresh fix is `overscroll-behavior-y: contain`). Turn off the long-press menu with `-webkit-touch-callout: none` and selection with `-webkit-user-select: none` (still prefixed on iOS).
- **Audio:** audio can only start in `pointerup` or `touchend` on touch, not `pointerdown`. Babylon's audio engine has `unlockAsync()`, a default unmute button and a click-to-unlock listener. An open WebKit bug makes Web Audio go silent after a Home Screen app returns from the background on iOS 26.
- **Android install:** needs HTTPS, 30 s on the page plus one tap, a manifest with name, 192 and 512 px icons, `start_url` and `display`, and a service worker fetch handler for the prompt. Ship separate `any` and `maskable` icons (40%-radius safe zone, not `"any maskable"`). iOS uses `apple-touch-icon` and ignores maskable icons. `@vite-pwa/assets-generator` makes the full set from one SVG.
- **Hosting:**
  - GitHub Pages: free for public repos, a fixed `max-age=600` with no custom headers, deploys through Actions, and needs `base: '/<repo>/'` unless on a custom domain.
  - Cloudflare: Pages, or the Workers static assets it now recommends, with free unlimited static requests, `_headers`, and `max-age=0, must-revalidate` by default.
  - Netlify: 300 credits a month, a hard limit, with 15 credits per production deploy, plus `_headers` and `max-age=0` by default.
  - All three offer HTTPS, custom domains and deploys from CI. The `sw.js` cache headers matter little, because update checks bypass the HTTP cache.
