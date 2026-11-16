# 32: PWA: offline, install and safe updates

**What to build:** Pin Game installs to the home screen on Android and iOS with its own icon and name, plays fully offline after the first load, and updates silently only at a safe moment: before the first tap of a Level, or once a win or lose banner shows. It never updates mid-Level. See [spec](../spec.md): PWA, hosting and updates; ADR 0003; PWA tickets (14, 15).

**Blocked by:** 25 (Timeline and overlapping animations), 29 (Workbench HUD look).

**Status:** ready-for-agent

- [x] `vite-plugin-pwa` 2.0.0 with `generateSW`. Glob patterns cover js, css, html, json, mp3, woff2, the webmanifest and icons. There's no runtime network use.
- [x] `registerType: 'prompt'` with no toast. On `onNeedRefresh`, `updateSW()` is called only at a safe moment (zero taps on the current Level, or a banner showing). `registration.update()` runs on `visibilitychange` → visible. The safe-moment decision is a small pure function with tests.
- [x] The service worker is off in `pnpm dev`.
- [x] Meta tags: `viewport-fit=cover`, `apple-mobile-web-app-status-bar-style: default` and `apple-mobile-web-app-capable`.
- [x] Manifest: name and short_name "Pin Game", a fixed `id`, `start_url` and `scope` `./`, `display: standalone`, `orientation: portrait`, `theme_color` `#34505b`, `background_color` `#1f2f36`.
- [x] Icons from one SVG (Candy-red Pin head with a cross recess on the slate gradient) via `@vite-pwa/assets-generator`: 192 and 512 `any`, a separate 512 `maskable` (head radius 150/512) and a 180 `apple-touch-icon`.
- [x] Vite `base` comes from an env var (default `/`).
- [x] The dev bar shows the build version or hash.
- [ ] Checked by hand under `pnpm build && pnpm preview`: it works offline, and a rebuilt version applies only at a safe moment.

## Implementation notes

- Safe-moment rule is `src/pwa/safe-moment.ts` (tested); `src/pwa/updater.ts` wires `registerSW` and the `visibilitychange` update check; `main.ts` feeds it taps (Undo back to the start counts as zero taps) and the banner flag.
- `workbox-window` added as a dev dependency: `virtual:pwa-register` fails to build without it.
- `pnpm icons` regenerates icons from `public/icon-source.svg` (generated files are committed). Maskable uses padding 0 so the head is 150/512; the `any` icons are full-bleed squares, not transparent.
- Version shows in the dev viewer summary (`build <git hash>`; override with `APP_VERSION`). `BASE_PATH` env sets Vite `base`.
- Verified here: build succeeds; manifest and `sw.js` precache list look right. Not verified (needs a deployed build/device): offline play, install and icons on Android/iOS, the update applying only at a safe moment, the status bar style. The by-hand checkbox stays unticked for that reason.
