# PWA hosting, caching and updates

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 10, 14

## Question

How is the first playable installed, cached, hosted and updated? Specifically:

- Where is it hosted, and does creating the remote also add the CI that Checks in the toolchain put off (run `pnpm check`, then deploy)?
- What is precached for offline play (the whole bundle and every level), and is there anything it should fetch from the network?
- When a new version is deployed, does an installed copy update silently on the next launch, or show a "new version" prompt? What happens if an update arrives in the middle of a level?
- Which iOS and Android quirks from PWA facts for Vite and iOS need handling in the first version (portrait lock, safe areas, stopping browser zoom and pull-to-refresh, long-press callouts), and which can wait?
- What is the minimum manifest: name, icons (including maskable), theme colour, display mode, orientation?
- Is `navigator.storage.persist()` requested now, or only once saved progress exists (out of scope for the first version)?

## Answer

Resolved with the human on 2026-11-15 (grilling), building on [PWA facts for Vite and iOS](14-pwa-facts-for-vite-and-ios.md). The game's name is now **Pin Game**. The status-bar style and the update mode are recorded in [ADR 0003](../../../docs/adr/0003-pwa-status-bar-and-update-mode.md), because neither can be changed cheaply after the first deploy. No glossary change.

**Hosting and CI**

- **GitHub Pages, public repo named `pin-game`**, so the site is at `<user>.github.io/pin-game/`. No custom domain for now.
- **Base path:** Vite's `base` comes from an env var that CI sets to `/pin-game/`. Local `pnpm dev` and `vite preview` stay on `/`. The manifest uses relative `start_url: './'` and `scope: './'`, so adding a custom domain or moving host later only means changing `base`.
- Pages' fixed `max-age=600` is harmless: assets are hashed, the service worker serves `index.html`, and update checks skip the HTTP cache.
- **CI, added when the remote is created:** one workflow, `.github/workflows/deploy.yml`.
  - On every push to `main`, it runs `pnpm install --frozen-lockfile`, then `pnpm build`, then `actions/upload-pages-artifact` and `actions/deploy-pages`. `pnpm build` runs `pnpm check` first, so a failing test, lint error, Prettier diff or unwinnable level blocks the deploy.
  - On pull requests, it runs `pnpm check` only.
  - Node 20.19 or later is pinned in `.nvmrc` (`vite-plugin-pwa` 2 needs it), and pnpm is pinned through `packageManager` in `package.json`. The repo's Pages source is set to "GitHub Actions".
  - There are no preview deploys and no release tags.

**Caching: fully offline, no runtime network**

- `vite-plugin-pwa` 2.0.0 with `generateSW`, precaching everything:
  - JS, CSS, HTML (kept in the list)
  - JSON, as a safety net
  - the webmanifest and icons
  - the self-hosted font that UI visual style chooses
- Levels and Models are bundled with an eager `import.meta.glob`, so they're versioned with the code.
- Nothing is fetched from the network after the first load: no CDN fonts, no analytics, no remote levels.

**Updates: `prompt` mode, applied silently at a safe moment**

- The mode is `registerType: 'prompt'`, the default. `autoUpdate` was rejected because it reloads open tabs and could wipe a level in progress. Switching modes after launch is painful, so this is fixed now (ADR 0003).
- There is no player-facing "new version" toast. When `onNeedRefresh` fires, the game calls `updateSW()` only at a **safe moment**:
  - while the current level has had zero taps, or
  - once a win or lose banner is showing.

  It never applies mid-level. Reloading then lands on a fresh level, since the first version has no saved progress.
- On `visibilitychange` → visible, the game calls `registration.update()`. This covers iOS possibly resuming a Home Screen app from memory without checking for updates (unverified).
- The dev bar shows a small build version or hash.

**iOS and Android quirks: handled in the first version**

- `viewport-fit=cover`, plus the safe-area probe from Screen layout and HUD.
- **Status bar: `apple-mobile-web-app-status-bar-style` = `default`**, plus `apple-mobile-web-app-capable` in case it's still needed. Both must be in the first deploy, because installs without the tag get the wrong `100vh` until reinstalled.
  - With `default`, the page starts below the status bar, so the iOS 26.1+ bug (top inset reads 0) can't push the Box row under the notch.
  - `black-translucent` (full-bleed) was rejected until WebKit fixes that bug. Switching later costs existing installs a reinstall, which is acceptable for a hobby build.
- `touch-action: none` on the canvas. This stops the browser's double-tap and pinch zoom, so the game's own pinch zoom works. iOS ignores `user-scalable=no`.
- `overscroll-behavior: none` on `html` and `body`: no pull-to-refresh or rubber-banding.
- `-webkit-touch-callout: none` and `-webkit-user-select: none` / `user-select: none` on everything. A long-press callout would otherwise break Peek.
- Manifest `orientation: portrait`, which Android honours. iOS can't lock orientation, so a rotated phone gets the centred portrait column from Screen layout and HUD.
- **Deferred:**
  - `navigator.storage.persist()` waits for the local progress store in the vision. There's nothing to lose today, because an evicted precache just downloads again.
  - The Web Audio unlock belongs to [Sound in the first version](16-sound-in-the-first-version.md).

**Manifest**

- `name` and `short_name` are both "Pin Game". It's 8 characters, so it isn't cut off under the icon.
- A fixed `id`, `start_url: './'`, `scope: './'`, `display: standalone` (the only app mode iOS supports), `orientation: portrait`, `theme_color` and `background_color`.
- **Icons:**
  - 192 and 512 px with `purpose: any`
  - a separate 512 px `maskable` icon (not `"any maskable"`), with art inside the 40%-radius safe zone
  - a 180 px `apple-touch-icon`

  All are generated from one SVG by `@vite-pwa/assets-generator`.
- Placeholder until [UI visual style](17-ui-visual-style.md) gives the final art and colours: a Candy-red Pin head with the cross recess, on a neutral background.

**Testing**

- The service worker stays **off in `pnpm dev`** (no `devOptions.enabled`), so stale caches never confuse development.
- Offline and update behaviour are checked with `pnpm build && pnpm preview`. There is no automated service worker test (no Playwright yet).
- **Manual device checklist after the first deploy**, which goes into the spec:
  1. Install on Android: the install prompt appears, and the maskable icon looks right.
  2. Install on iOS: the icon and name are right.
  3. Turn on airplane mode and cold-launch: the level plays fully offline.
  4. Push a trivial change. Mid-level, the app doesn't reload. After a win or loss (or on a fresh level), the new version is live, and the dev bar's version changes.
  5. On a notched iPhone with iOS 26.1+: the Box row sits clear of the status bar, and `100vh` fills the screen with no gap.
  6. Pinch, double-tap, pull-down and long-press: no browser zoom, refresh, callout or selection.
  7. Rotate the phone: Android stays portrait, and iOS shows the centred column.
