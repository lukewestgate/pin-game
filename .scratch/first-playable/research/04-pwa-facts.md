# Research: PWA facts for Vite and iOS

Ticket: [../issues/14-pwa-facts-for-vite-and-ios.md](../issues/14-pwa-facts-for-vite-and-ios.md)
Researched: 2026-11-15. Versions current as of that date.

The question is what the PWA decisions (ticket 15, PWA hosting, caching and updates) depend on, for a Vite + Babylon.js single-page game. This file builds on [01-engine-options.md](01-engine-options.md) §1, which already covers iOS 26 opening every Home Screen site as a web app, the storage quota, `navigator.storage.persist()` and eviction. Those facts are not repeated here.

Unless marked *measured*, *community report* or *unverified*, each claim links to the source that owns it. "BCD" is MDN's browser-compat-data repo (https://github.com/mdn/browser-compat-data), the data behind MDN's and Can I Use's compatibility tables, read on 2026-11-15.

---

## 0. Versions in scope (Nov 2026)

| Package / platform | Current | Source |
|---|---|---|
| `vite-plugin-pwa` | 2.0.0 (3 Oct 2026). 1.3.0 (5 May 2026) added Vite 8 support and an `onNeedReload` callback | `npm view vite-plugin-pwa`, https://github.com/vite-pwa/vite-plugin-pwa/releases |
| Workbox (`workbox-build`, `workbox-window`) | 7.4.1, the plugin's peer range is `^7.4.1` | `npm view vite-plugin-pwa peerDependencies` |
| Vite | 8.3.8 on npm; the plugin's peer range covers Vite 3–8 | `npm view vite version`, same |
| `@vite-pwa/assets-generator` | 2.0.0 (25 Oct 2026) | `npm view @vite-pwa/assets-generator` |
| Safari / iOS | Safari 27.0 shipped with iOS 27 on 14 Sep 2026. 27.1 (23 Oct) and 27.2 (26 Oct) followed | https://webkit.org/blog/18325/webkit-features-for-safari-27-0/, https://webkit.org/blog/18486/webkit-features-for-safari-27-1/, https://webkit.org/blog/18515/webkit-features-for-safari-27-2/ |

The only breaking change listed for `vite-plugin-pwa` 2.0.0 is "requires Node 20.19.0 or above". The release itself mostly widens the assets-generator peer range to v2 (https://github.com/vite-pwa/vite-plugin-pwa/blob/main/README.md, releases page).

None of the Safari 27.0, 27.1 or 27.2 posts mentions Home Screen web apps, the manifest, orientation, the status bar, `touch-action`, `-webkit-touch-callout` or the audio unlock. So nothing in iOS 27 changes the iOS 26 picture in §2 as far as WebKit's release notes go. Two Safari 27 items are relevant:
- 27.0 adds the Service Worker static routing API (rules that let the browser bypass the service worker). It's not needed here.
- 27.1 introduces a new device ("iPhone Duo") whose viewport width "can range from 382 to 951" CSS pixels, with an outer display that "works in portrait or landscape". A portrait-only layout should tolerate unusual widths and aspect ratios.

## 1. `vite-plugin-pwa`

### 1.1 `generateSW` versus `injectManifest`

From https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors.html and https://vite-pwa-org.netlify.app/guide/inject-manifest.html:

- **`generateSW` (default):** "the vite-plugin-pwa will generate the service worker for you". You configure it through the `workbox` option (glob patterns, runtime caching rules and so on) and write no service worker code.
- **`injectManifest`:** you write the service worker, and the plugin "will compile your custom service worker" and inject the precache list into it.
  - It must call `precacheAndRoute(self.__WB_MANIFEST)` from `workbox-precaching`. The docs strongly recommend calling `cleanupOutdatedCaches()` first.
  - TypeScript works: set `srcDir: 'src'` and `filename: 'sw.ts'`, add `"WebWorker"` to `lib`, and `declare let self: ServiceWorkerGlobalScope`. It's built by Vite/Rollup, and from v0.18.0 you can add build plugins through `buildPlugins.vite` and `buildPlugins.rollup`.
  - You implement the update behaviour yourself. For `prompt`, add a `message` listener that calls `self.skipWaiting()` on `{type: 'SKIP_WAITING'}`. For `autoUpdate`, call `self.skipWaiting()` and `clientsClaim()` from `workbox-core`.
- **Why it matters here:** a static offline game with no push notifications, background sync or custom fetch logic needs nothing beyond precaching. That's the `generateSW` case. `injectManifest` is for custom service worker code. That last point is judgement from the two docs pages, not a sentence either one states.

### 1.2 Precaching a roughly 1 MB bundle plus `data/` JSON

- **What gets precached by default:** the plugin's default `globPatterns` is `**/*.{js,css,html}` (https://vite-pwa-org.netlify.app/guide/static-assets.html). Workbox's own default also includes `wasm` (https://developer.chrome.com/docs/workbox/reference/workbox-build). JSON is **not** in either default.
  - If level and Model JSON is `import`ed from TypeScript, Vite bundles it into a JS chunk, so it's precached anyway.
  - If it's served as files (for example from `public/data/`), add `json` to `globPatterns`. Once you set `globPatterns` you "MUST" list every pattern you need, including `html`. Leaving out `html` gives "WorkboxError non-precached-url index.html" (same page).
- **Other static files:** `includeAssets` adds static files from Vite's `publicDir` (default `public`), resolved with tinyglobby, for example `includeAssets: ['fonts/*.ttf']`. Manifest icons in `publicDir` are precached by default (`includeManifestIcons`) (same page).
- **Size cap:** Workbox's `maximumFileSizeToCacheInBytes` defaults to **2097152 (2 MiB)**. Files over the cap are not precached, which "prevent[s] large files that accidentally match your patterns" (https://developer.chrome.com/docs/workbox/reference/workbox-build). The cap is per file and on the uncompressed size, so a ~1 MB total bundle is fine. A single Babylon chunk could get close if it isn't tree-shaken: the UMD bundle is 8.9 MB raw (01-engine-options §2.1). Check chunk sizes after the first build and raise the cap if needed. That's an inference from the default, not a reported problem.
- **Updates and cleanup:** `cleanupOutdatedCaches` is on by default with `generateSW`. It removes the old precache after an update, and old and new assets sit side by side until then (https://vite-pwa-org.netlify.app/guide/prompt-for-update.html). Vite's content-hashed filenames mean unchanged chunks are not downloaded again. Strictly, that's how Workbox's revisioned precache works in general, not something either page says about Vite specifically.

### 1.3 Update strategies: `prompt` versus `autoUpdate`

- **`prompt` (the default `registerType`):** you may want to "inform the user that there is a new version" and let them decide, "to prevent data loss if the user is filling out a form" (strategies page).
  - In code, `registerSW({ onNeedRefresh, onOfflineReady })` from `virtual:pwa-register`. `onNeedRefresh` should show refresh and cancel buttons. Calling the returned `updateSW()` activates the new worker and reloads. `onOfflineReady` fires once the app is cached for offline use (https://vite-pwa-org.netlify.app/guide/prompt-for-update.html).
- **`autoUpdate`:**
  - The plugin forces `workbox.clientsClaim` and `workbox.skipWaiting` to `true`. It "will update the caches and will reload any browser windows/tabs with the application opened automatically". The docs also use `registerSW({ immediate: true })` from `virtual:pwa-register` in the entry point (https://vite-pwa-org.netlify.app/guide/auto-update.html).
  - Warning from the same page: "the user can lose data in any browser windows/tabs in which the application is open". For a game, that means a level in progress. The page also warns that switching from `autoUpdate` to `prompt` after going to production "can be a pain", so choose before the first deploy.
- **When the browser checks for an update:** after a navigation to an in-scope page, after functional events (push, sync) at most once per 24 hours, and on `register()` with a changed URL. The browser fetches the worker script ignoring HTTP caching headers by default (`updateViaCache: 'imports'`) (https://web.dev/articles/service-worker-lifecycle, https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register).
  - Without `skipWaiting`, a new worker waits until no page uses the old one. A plain refresh is not enough (web.dev, same).
  - The same article advises against versioned service worker URLs ("Don't do this!").
- **Periodic checks:** the plugin documents calling `registration.update()` on an interval inside `onRegisteredSW(swUrl, r)`. A hardened version skips the check when offline or while a worker is installing, and fetches `swUrl` with `cache: 'no-store'` first (https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html).
- *Inference, unverified:* a Home Screen app that iOS resumes from memory doesn't navigate, so it may not check for updates until it's cold-launched. Calling `r.update()` on `visibilitychange` covers that. No primary source states this iOS behaviour.

## 2. iOS Home Screen quirks for a game

### 2.1 Locking to portrait

- **The manifest `orientation` member does nothing on iOS.** BCD has `safari: version_added: false`, and `safari_ios` mirrors it, while Chrome has supported it since 39 (BCD `manifests/webapp/orientation.json`).
  - WebKit landed *parsing* of the member in March 2023 (https://bugs.webkit.org/show_bug.cgi?id=247275, RESOLVED FIXED). BCD and Can I Use still list no support through iOS 26.5, so parsing evidently doesn't lock anything.
- **`screen.orientation.lock()` doesn't work on iPhone either.** The WebKit bug thread (https://bugs.webkit.org/show_bug.cgi?id=257695, closed WORKSFORME, last touched July 2024) reports:
  - on iPhone: "SecurityError: Locking the screen orientation is only allowed when in fullscreen"
  - on iPad: "NotSupportedError: Apps supporting multiple scenes (multitask) cannot lock their orientation"

  A WebKit engineer only speculates that it "may work as an Home Screen web application". The thread never confirms it. The 27.x release notes say nothing more (§0).
- **What follows:** on iOS the page has to handle landscape itself, for example with a "rotate your phone" overlay keyed on `(orientation: landscape)`, or a layout that still works sideways. On Android, `"orientation": "portrait"` in the manifest applies to the installed app (Chrome 39+, BCD). The overlay or layout is an inference from the missing API, not something Apple recommends.

### 2.2 Standalone display and the status bar

- **Display mode:** `display: standalone` and `browser` are supported on iOS since 11.3. `fullscreen` and `minimal-ui` are not supported in Safari or iOS at all (BCD `manifests/webapp/display.json`).
  - On iOS 26+ the user's "Open as Web App" toggle decides standalone versus bookmark, not the site (01-engine-options §1, https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
- **Status bar:** the only control is the legacy `<meta name="apple-mobile-web-app-status-bar-style">`, with values `default`, `black` and `black-translucent`. Only `black-translucent` draws the page under the status bar, "partially obscured by the status bar". The legacy doc says it has "no effect unless" `apple-mobile-web-app-capable` is also set (https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html, archived and undated). That doc predates iOS 26's "every Home Screen site is a web app" change, so whether the `capable` tag is still needed is *unverified*.
- **Open WebKit bugs that matter here** (both *unverified* beyond the bug threads):
  - https://bugs.webkit.org/show_bug.cgi?id=301994, "REGRESSION (iOS 26.1): Status bar remains visible in fullscreen mode in Home Screen Web apps". Reopened, last modified 10 Nov 2026. Reporters say `env(safe-area-inset-top)` returns 0 and a system-drawn gap appears above the page. It was reported again on 26.5.2, the iOS 27 betas and 27.2, so the 26.2 fix did not hold.
  - https://bugs.webkit.org/show_bug.cgi?id=316008, "Incorrect 100vh and -lvh in standalone web apps that have not set apple-mobile-web-app-status-bar-style". Status NEW, filed June 2026 against iOS 26. Adding the tag later doesn't fix an existing install; the user has to reinstall. So the status-bar choice has to be in the first deploy.
- **`theme-color`:** I found only *community reports* that Safari 26 ignores `theme-color` in web apps (for example https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/). There's no WebKit statement. Treat it as unreliable on iOS and test on a device.

### 2.3 Safe-area insets with `viewport-fit=cover`

- `<meta name="viewport" content="..., viewport-fit=cover">` turns off Safari's default insetting so the page can "lay out to the full size of the screen". CSS then reads `env(safe-area-inset-top|right|bottom|left)` to keep HUD content clear of the notch, Dynamic Island and home indicator (https://webkit.org/blog/7929/designing-websites-for-iphone-x/, 2017).
- The Safari 27.1 post on the new foldable still points to `viewport-fit="cover"` and "the appropriate environment variables" as the way to use the space behind system controls (https://webkit.org/blog/18486/webkit-features-for-safari-27-1/).
- Caveat: bug 301994 (§2.2) reports the top inset reading 0 on some iOS 26.x and 27.x versions. Layouts should survive a zero inset.

### 2.4 Double-tap zoom, pinch zoom and pull-to-refresh

- **Viewport zoom flags are ignored.** Since iOS 10, "we ignore the `user-scalable`, `min-scale` and `max-scale` settings" (https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/), so `user-scalable=no` doesn't stop pinch zoom on iOS.
- **`touch-action` does stop it.** `touch-action` is supported on iOS since 9.3 (`manipulation`) and since Safari 13 (`none`, `pan-x`, `pinch-zoom`) (BCD `css/properties/touch-action.json`).
  - `touch-action: manipulation` makes WebKit treat touches "only for the purposes of panning and pinching to zoom". That removes double-tap zoom and the tap delay (https://webkit.org/blog/5610/more-responsive-tapping-on-ios/).
  - `touch-action: none` on the canvas also stops the browser from handling pinch there. Babylon already requires `touch-action: none` on its canvas (01-engine-options §2.4).
  - Elements outside the canvas (HUD, Boxes drawn in the scene) need `manipulation` or `none` too, or a double-tap there can still zoom. That's an inference.
- *Community report, unverified:* pinch can still zoom the page when it starts outside a `touch-action: none` element. The usual fix is `preventDefault()` on Safari's non-standard `gesturestart` event. No WebKit doc for that was found.
- **Pull-to-refresh and overscroll:**
  - `overscroll-behavior` is supported from Safari 16 on desktop and iOS, but "has no effect on scroll containers that have no scrollable overflow" (BCD).
  - Chrome's documented way to turn off Android pull-to-refresh is `overscroll-behavior-y: contain` on `html` or `body` (https://developer.chrome.com/blog/overscroll-behavior).
  - A full-screen canvas page that never scrolls (`html, body { height: 100%; overflow: hidden }`) gives the browser nothing to pull. That's an inference.
  - Whether iOS standalone web apps have pull-to-refresh at all, or only rubber-band bounce, is *unverified*.

### 2.5 Long-press callouts and text selection

- `-webkit-touch-callout: none` turns off the iOS long-press callout (link and image menu). It's supported on iOS since version 2 (BCD `css/properties/-webkit-touch-callout.json`).
- `user-select: none` is still **prefixed** on iOS in BCD: `-webkit-user-select` since iOS 3. Desktop Safari gained the unprefixed form in 27.3 (BCD `css/properties/user-select.json`). Ship both. This matters because Peek is a press-and-hold, which would otherwise trigger selection or the callout.
- `-webkit-tap-highlight-color: transparent` (removes the grey tap flash) is a non-standard WebKit property. I did not check it against a primary source here.

### 2.6 Web Audio unlock on first touch

- **Which events unlock audio:** the HTML spec lists the "activation triggering input events": `keydown` (not Esc), `mousedown`, `pointerdown` when `pointerType` is `"mouse"`, `pointerup` when it isn't, and `touchend` (https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event).
  - For touch, `pointerdown` is **not** an activation, so `AudioContext.resume()` must run in `pointerup` or `touchend`. On iOS that's the first finger lift, and it could be the end of the first rotate drag.
  - The audio-specific wording is MDN's: starting audio "outside the context of handling a user input event is subject to autoplay rules" (https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay, modified 10 Sep 2026).
- **Babylon's audio engine** (`CreateAudioEngineAsync`, "AudioEngineV2") handles this itself:
  - `await audioEngine.unlockAsync()`
  - a default unmute button in the top-left of the canvas, removed with `disableDefaultUI`
  - a document-wide `click` listener that unlocks audio on any interaction (`resumeOnInteraction`)
  - an automatic re-unlock when the browser suspends audio again (`resumeOnPause`)

  (https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic). Note that the listener is on `click`.
- **Silent switch:** `navigator.audioSession.type` (Audio Session API) is supported in Safari and iOS since 16.4, and not in Chrome (BCD `api/AudioSession.json`). Values are `auto`, `playback`, `transient`, `transient-solo`, `ambient` and `play-and-record` (https://developer.mozilla.org/en-US/docs/Web/API/AudioSession). MDN doesn't say how each value interacts with the ring/silent switch, so which one respects it is *unverified*.
- **Open WebKit bug:** https://bugs.webkit.org/show_bug.cgi?id=291892, "WebAudio AudioContext silent after PWA returns from background". Status NEW. A context can report `running` yet play silence after resume, and iOS 26 users reported audio working only on the first launch of a Home Screen app. One user said 26.2 beta 3 fixed it, which WebKit hasn't confirmed. This affects ticket 16 (Sound) more than this one.

## 3. Android Chrome install

### 3.1 What makes the install prompt appear

From https://web.dev/articles/install-criteria (undated). Chrome fires `beforeinstallprompt` and shows its install promotion when:
- the app is not already installed
- the user has clicked or tapped the page at least once and spent at least 30 seconds viewing it, at any time, even on an earlier visit
- the page is served over HTTPS
- the manifest has `short_name` or `name`, `icons` including a 192 px and a 512 px icon, `start_url`, `display` set to `fullscreen`, `standalone`, `minimal-ui` or `window-controls-overlay`, and no `prefer_related_applications: true`

Users can still install from the menu without meeting the criteria.

On the service worker: Chrome dropped the `fetch` handler requirement for **menu** installs (Chrome 108 on Android, 112 on desktop), but "the algorithm that displays the install prompt still requires the presence of a `fetch()` handler" (https://developer.chrome.com/blog/update-install-criteria, undated). A `generateSW` worker always has a fetch handler for precaching, so this is satisfied either way.

`beforeinstallprompt` is Chromium-only: Safari, iOS and Firefox are all `version_added: false`, and it's flagged experimental and non-standard (BCD `api/BeforeInstallPromptEvent.json`). On iOS, installing is always Share → Add to Home Screen, with no prompt event.

### 3.2 Maskable icons

- **Safe zone:** a maskable icon keeps its important content "within a circular area in the center of the icon with a radius equal to 40% of the icon width". The outer edge may be cropped (https://web.dev/articles/maskable-icon).
- **Declaring it:** `"purpose": "maskable"`. web.dev advises **against** `"any maskable"`, because the padding shrinks the icon wherever it's used as `any`. Ship separate `any` and `maskable` icons (same page).
  - MDN lists the purposes `any` (default), `maskable` and `monochrome` (https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons, modified 23 Jun 2025).
  - Without a maskable icon, Android puts `any` icons on a white background, so transparent icons "appear inside white circles" (web.dev). Maskable.app previews the crop shapes.
- **iOS:** iOS uses `<link rel="apple-touch-icon">` first. Manifest icons are used only "when no `apple-touch-icon` is present and either `purpose` is set to `any` or not specified" (BCD `manifests/webapp/icons.json`, iOS 15.4+). iOS ignores maskable icons.
- **Tooling:** `@vite-pwa/assets-generator` (2.0.0) has a `minimal-2023` preset that makes the whole set from one SVG (https://vite-pwa-org.netlify.app/assets-generator/):
  - `favicon.ico` at 48 px
  - `favicon.svg`
  - transparent PNGs at 64, 192 and 512 px (the 512 marked `any`)
  - a 512 px maskable PNG
  - a 180 px `apple-touch-icon`

## 4. Static hosting for a free hobby project

| | GitHub Pages | Cloudflare (Pages, or Workers static assets) | Netlify |
|---|---|---|---|
| Free tier | Public repos on GitHub Free. Private-repo Pages needs Pro or an org (https://docs.github.com/en/get-started/learning-about-github/githubs-plans). 1 GB site, 100 GB/month soft bandwidth, 10 builds/hour soft limit that doesn't apply to custom Actions workflows (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | Pages Free: 500 builds/month, 1 concurrent, 20,000 files, 25 MiB per file, 100 custom domains per project (https://developers.cloudflare.com/pages/platform/limits/). Workers static asset requests are "free and unlimited" (https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) | 300 credits/month, a hard limit with no top-up, reset each cycle. A production deploy is 15 credits, bandwidth 20 credits/GB, 10k requests 2 credits. Deploy previews and branch deploys are free (https://www.netlify.com/pricing/, https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/). So about 20 production deploys or 15 GB a month |
| HTTPS | `github.io` always HTTPS. Custom domains get a Let's Encrypt certificate after the DNS check, plus an "Enforce HTTPS" option (https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) | HTTPS on `*.pages.dev` / `*.workers.dev` and custom domains (*unverified*: not on the pages fetched) | Free plan includes "Custom domains with SSL" (pricing page) |
| Cache headers | **No custom headers.** Every file is served `Cache-Control: max-age=600` (*measured* with `curl -I https://pages.github.com/` on 2026-11-15; GitHub's docs don't mention headers) | Default `Cache-Control: public, max-age=0, must-revalidate` plus an ETag (https://developers.cloudflare.com/pages/configuration/serving-pages/, https://developers.cloudflare.com/workers/static-assets/headers/). Custom headers come from a `_headers` file in the output folder, up to 100 rules (https://developers.cloudflare.com/pages/configuration/headers/) | Default `Cache-Control: public, max-age=0, must-revalidate`, with the CDN cache cleared on every deploy (https://docs.netlify.com/build/caching/caching-overview/). Custom headers come from `_headers` or `netlify.toml` `[[headers]]` (https://docs.netlify.com/manage/routing/headers/) |
| Deploy from CI | Actions: `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`, with `pages: write` and `id-token: write` permissions and the `github-pages` environment (https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Actions are free on standard runners for public repos (plans page). Vite's docs include a sample workflow (https://vite.dev/guide/static-deploy) | Git integration in the dashboard, or GitHub Actions with `cloudflare/wrangler-action@v4` and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets running `wrangler deploy` (https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) | Git integration, or `netlify deploy --prod --dir=dist` from any CI with `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`, and `netlify-cli` as a dev dependency (https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/) |
| Custom domain | Yes (docs above) | Yes, 100 per Pages project | Yes |
| URL path | A project site is at `/<repo>/`, so Vite needs `base: '/<repo>/'` (https://vite.dev/guide/static-deploy). The manifest's `start_url` and `scope` and the service worker scope follow it. A user site or custom domain is at `/` | `/` | `/` |

Notes for the decision:

- **Cache headers on the service worker file matter less than they seem.** The browser fetches the main service worker script ignoring the HTTP cache by default (§1.3). So GitHub Pages' fixed `max-age=600` doesn't delay update detection for `sw.js`.
  - It can still serve a cached `index.html` or `manifest.webmanifest` for up to 10 minutes to a browser that isn't yet controlled by the service worker.
  - Hashed JS and CSS are safe under any max-age.

  The two paragraphs above are inference from the cited defaults.
- **Cloudflare is steering new projects to Workers.** The Pages landing page now says "Are you sure you want to use Pages?" and "Start new projects with Workers" (https://developers.cloudflare.com/pages/, read 2026-11-15).
  - Workers static assets also support `_headers` and return `index.html` for unknown paths with `not_found_handling = "single-page-application"` (https://developers.cloudflare.com/workers/static-assets/). Vite has an official `@cloudflare/vite-plugin` path (Vite docs above).
- **Netlify's credit model counts deploys.** Deploying on every push to `main` uses 15 of 300 credits each time, so a busy week could pause the site. The docs link a "Resume paused projects" page, so pausing is implied, but I didn't open that page to confirm it.

## 5. Not verified

- Whether `screen.orientation.lock()` works in an iOS Home Screen web app: there's only speculation in WebKit bug 257695.
- Whether `apple-mobile-web-app-capable` is still needed for `apple-mobile-web-app-status-bar-style` to work on iOS 26+, and how `theme-color` behaves there (community reports only).
- iOS standalone pull-to-refresh behaviour, and the `gesturestart` workaround for pinch.
- Which `audioSession.type` respects the iOS silent switch.
- Whether an iOS Home Screen app resumed from memory runs a service worker update check.
- Cloudflare HTTPS details and Netlify's pause behaviour (implied by linked pages, not read).
- GitHub Pages' `max-age=600`, which I measured myself rather than found in GitHub's docs.
- The dates of web.dev's install-criteria and maskable-icon articles and of Chrome's install-criteria blog post, which the pages don't show.
