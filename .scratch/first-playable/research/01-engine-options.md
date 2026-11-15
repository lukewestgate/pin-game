# Research: engine options for a mobile-first 3D PWA

Ticket: [../issues/01-engine-options-for-mobile-pwa.md](../issues/01-engine-options-for-mobile-pwa.md)
Researched: 2026-11-15. Versions current as of that date.

The question is which engine or library can ship the Peg Game first playable as an installable, offline PWA that runs well on mid-range iOS Safari and Android Chrome phones and also works on desktop. The first playable is one low-poly car Model, tap-to-remove Pins, drag to rotate, pinch or wheel to zoom, press-and-hold to Peek, and scripted tweens.

Unless marked *measured* or *community report*, each claim below links to the source that owns it.

---

## 0. Versions in scope (Nov 2026)

| Candidate | Latest | Source |
|---|---|---|
| Three.js | r187 (`three@0.187.0`, 30 Oct 2026) | https://github.com/mrdoob/three.js/releases, `npm view three` |
| Babylon.js | 9.36.0 (12 Nov 2026); 9.0 announced 26 Mar 2026 | https://github.com/BabylonJS/Babylon.js/releases, https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0 |
| PlayCanvas engine | 2.24.1 (12 Nov 2026) | https://github.com/playcanvas/engine/releases |
| Godot | 4.7.2-stable (18 Aug 2026); 4.7 released 18 Jun 2026 | https://github.com/godotengine/godot/releases, https://godotengine.org/download/archive/4.7-stable/ |
| Unity | 6.6 (6000.6) is the "current" manual; docs list a 7000.0 "latest". 6.6 shipped ~1 Sep 2026 | https://docs.unity.com/en-us/engine/current/manual/platform-specific/webgl/intro/browsercompatibility, https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/building-distribution/web-optimization-mobile.md (header shows `latest_version: '7000.0'`) |

The Unity 6.6 release date and its "production WebGPU" status come only from secondary coverage, e.g. https://alternativeto.net/news/2026/9/unity-6-6-adds-webgpu-build-analysis-and-coreclr-prep/. I did not find Unity's own release notes, so treat those two details as unverified.

## 1. Platform baseline (applies to every candidate)

- **WebGPU on iOS:** WebGPU shipped in Safari 26.0 for macOS, iOS, iPadOS and visionOS on 15 Sep 2025. WebKit says it "supersedes WebGL" and is preferred for new sites (https://webkit.org/blog/17333/webkit-features-in-safari-26-0/, https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/). WebGL 2 is still the safe common baseline.
- **Home Screen web apps:** On iOS/iPadOS 26, every site added to the Home Screen opens as a web app by default, and a manifest is no longer required. Manifest icons are still used. Service workers for offline use are supported (https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
- **Storage:** WebKit's storage policy gives a Home Screen web app the same quota as the browser app (up to 60% of disk per origin). WebKit grants `navigator.storage.persist()` using heuristics such as "whether the website is opened as a Home Screen Web App". Data that isn't persisted can be evicted least-recently-used first (https://webkit.org/blog/14403/updates-to-storage-policy/). The Godot docs give the same warning for their PWA cache (https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).
- **SharedArrayBuffer:** iOS Safari has supported it since 15.2 (https://caniuse.com/sharedarraybuffer), but only on cross-origin-isolated pages (COOP `same-origin` + COEP `require-corp`). This only matters for multithreaded wasm builds (Godot threads, Unity threads). See the Godot section.

## 2. Comparison by criterion

### 2.1 Download size and startup time

| Candidate | Engine payload | Notes |
|---|---|---|
| Three.js | ~181 kB min+gz for `three@0.187.0` per Bundlephobia (https://bundlephobia.com/package/three). *Measured*: unminified ESM `three.module.js` + `three.core.js` is ~419 kB gzip, so a minified, tree-shaken app build lands roughly in the 150–250 kB range | `sideEffects` is declared in package.json, so bundlers can tree-shake it (*measured* from the npm tarball) |
| Babylon.js | *Measured*: the UMD `babylon.js` bundle (9.36.0) is 8.9 MB raw / 1.93 MB gzip. The docs' ES6 example falls from ~2.3 MB to ~700 KB with tree-shaking via `@babylonjs/core` (https://doc.babylonjs.com/setup/frameworkPackages/es6Support) | Tree-shaking only works if you import from specific files. Some features need side-effect imports (same source) |
| PlayCanvas | *Measured*: `playcanvas.min.mjs` (2.24.1) is 2.89 MB raw / ~749 kB gzip. package.json declares `"sideEffects": false` | Physics (ammo) is an optional extra 379 KB (https://developer.playcanvas.com/user-manual/optimization/load-time/) |
| Godot 4.7 | No official figure. Docs say the wasm compresses to "around a quarter of its original size with gzip" and recommend Brotli/gzip on `.wasm`/`.pck` plus custom templates with unused features disabled (https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html, https://docs.godotengine.org/en/4.4/contributing/development/compiling/optimizing_for_size.html). *Community report*: ~35 MB `.wasm` for a stock 4.3 export (https://forum.godotengine.org/t/export-optimising-a-build-for-size/94584) | Expect several MB compressed before any game content. LTO and disabling modules require compiling your own export templates |
| Unity 6 | *Community report* by Aras Pranckevičius on 6.0.23: default 3D URP template 10.7 MB, aggressively stripped down to ~2.0 MB (https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365) | Unity's mobile guide recommends "Disk Size with LTO", Brotli and Addressables (https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/building-distribution/web-optimization-mobile.md) |

Startup: the JS libraries start parsing almost at once, with no wasm instantiate step. Godot and Unity must download, compile and instantiate a multi-MB wasm module first. PlayCanvas recommends aiming to load in under 5 s (https://developer.playcanvas.com/user-manual/optimization/load-time/). After the first visit, a PWA service worker cache removes the network cost for all candidates, but wasm compile time remains on every cold start.

### 2.2 Mobile GPU performance

- The scene here is tiny: one low-poly Model, dozens of Pins, flat or toon shading. Any of the five can render it at 60 fps on a mid-range phone if draw calls are kept low (instancing Pins, few materials). No source benchmarks these engines against each other for this kind of scene, so this point is judgement, not a cited fact.
- **Three.js:** `WebGPURenderer` "tries to use a WebGPU backend if the browser supports WebGPU. If not, [it] falls back to a WebGL 2 backend" (from the source doc comment in `three@0.187.0/build/three.webgpu.js`, *measured*). `WebGLRenderer` remains available.
- **Babylon.js 9:** supports WebGPU and WebGL 2. 9.0's headline features (clustered lighting, frame graph) target both (https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/).
- **PlayCanvas:** WebGPU and WebGL 2. Recent releases have been active on WebGPU fixes (https://github.com/playcanvas/engine/releases).
- **Godot 4.7 web:** Compatibility renderer (WebGL 2.0) only. "Forward+ and Mobile are unsupported because WebGPU isn't available" in Godot's web export. The docs also say "Safari has several issues with WebGL 2.0 support" and recommend Chromium or Firefox (https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). That warning matters because iOS is a primary target.
- **Unity 6.6:** WebGL 2 by default. WebGPU is opt-in and falls back to WebGL 2 (secondary coverage only, see §0). Unity's mobile guide says to use the Low/Very Low quality levels and ASTC textures (https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/building-distribution/web-optimization-mobile.md).

### 2.3 iOS Safari / Home Screen PWA support and known blockers

- **Three.js / Babylon.js / PlayCanvas:** No engine-specific blockers. They are plain JS + WebGL2/WebGPU, so the PWA is your own manifest plus service worker (for example via Vite and `vite-plugin-pwa`, https://github.com/vite-pwa/vite-plugin-pwa). No cross-origin isolation is needed.
- **Godot 4.7:**
  - Threads are optional. A threaded export needs COOP/COEP headers and "the project will not run" without them, unless you use the PWA option, which can inject the headers through a service worker. Since 4.3, single-threaded export "is the preferred and now default way", needs no special headers and "works very well on macOS and iOS too" (https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). **So the old SharedArrayBuffer blocker is gone if you export single-threaded**, at the cost of performance.
  - There is a built-in PWA export option for manifest, icons, orientation and an offline service worker (same source).
  - iOS-specific stability has been a recurring problem. One example is issue #107390: 4.4.1 and 4.5-dev builds crashed or reloaded on iOS Safari and Chrome after 1–3 minutes when audio was used, due to a leak in `library_godot_audio.js`. It was fixed by PR #107948 in June 2025 (https://github.com/godotengine/godot/issues/107390). *Community reports* of WebGL context loss and memory-limit reloads on iOS are here: https://forum.godotengine.org/t/webgl-context-loss-and-app-crash-in-godot-4-3-exported-web-on-ios-browsers/81024 and https://forum.godotengine.org/t/godot-4-4-1-html-exports-resets-crashes-when-playing-on-mobile-browsers/114247.
  - **C# cannot be exported to the web in Godot 4**: "Projects written in C# using Godot 4 currently cannot be exported to the web" (https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). Godot means GDScript only.
- **Unity 6.6:** Supported mobile browsers are "iOS Safari 15 and newer" and "Chrome 58 and newer" on Android. Unity offers a PWA web template (https://docs.unity.com/en-us/engine/current/manual/platform-specific/webgl/intro/browsercompatibility). Older manuals (2023.2 and earlier) said Web "doesn't officially support mobile devices", and the current manual drops that caveat (https://docs.unity3d.com/2023.2/Documentation/Manual/webgl-input.html vs https://docs.unity.com/en-us/engine/6000.5/manual/platform-specific/webgl/develop/input). Unity's own roadmap entry for mobile web warns that support may not cover lower-end, low-RAM devices (https://activation.unity3d.com/roadmap/415-web-mobile-browser-support, via search result, not opened).

### 2.4 Touch gestures (tap, drag, pinch, press-and-hold)

The design needs one-finger drag to rotate, tap to remove a Pin, pinch or wheel to zoom, no pan, and a hold of a set length to Peek. **No candidate ships a press-and-hold recogniser that does what Peek needs**, so tap vs hold vs drag disambiguation is custom code everywhere (a timer plus a movement threshold).

- **Three.js:** `OrbitControls` gives "Orbit: one-finger move", "Zoom: mousewheel / two-finger spread or squish", and pan, which can be disabled with `enablePan = false`. `touches` maps `ONE: ROTATE, TWO: DOLLY_PAN` (https://threejs.org/docs/pages/OrbitControls.html). Picking uses `Raycaster` with your own Pointer Events handlers. Tap and hold are yours to write.
- **Babylon.js:** `scene.onPointerObservable` exposes `POINTERDOWN/UP/MOVE/WHEEL/PICK/TAP/DOUBLETAP` with built-in picking. The canvas needs `touch-action: none` (https://doc.babylonjs.com/features/featuresDeepDive/scene/interactWithScenes). `ArcRotateCamera` has `pinchPrecision` / `pinchDeltaPercentage` for pinch zoom (*measured* from `babylon.d.ts` 9.36.0). This is the most built-in input support of the JS options.
- **PlayCanvas:** The `camera-controls.mjs` script in the npm package provides orbit, fly and pan "driven by mouse, touch and gamepad input", with a "touch zoom pinch sensitivity" setting (*measured* from `playcanvas@2.24.1/scripts/esm/camera-controls.mjs`).
- **Godot:** `InputEventScreenTouch` / `InputEventScreenDrag`, plus `InputEventMagnifyGesture` for pinch ("usually performed when the user pinches the touch screen"). Its docs don't list which platforms emit it, only an Android setting (https://docs.godotengine.org/en/stable/classes/class_inputeventmagnifygesture.html). Whether the web build emits magnify gestures is unverified, so plan to compute pinch from two `ScreenDrag` events.
- **Unity:** The Input System has `Touchscreen` and `EnhancedTouch` (multi-touch, `tap`, `tapCount`) but no hold recogniser on the touch page. That page lists touch platforms as "Android, iOS, Windows, and UWP" and does not mention Web (https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Touch.html). The Web manual says Unity "implements Input.touches and other related APIs in browsers and devices with touch support" (https://docs.unity.com/en-us/engine/6000.5/manual/platform-specific/webgl/develop/input).

### 2.5 Tweening and animation

Needed: Pin → Box/Buffer, Buffer → Box, Box close and slide-in, Part falling away. All scripted, no physics.

- **Three.js:** Nothing in core. It ships tween.js as `examples/jsm/libs/tween.module.js` (exports `Tween`, `Easing`, `Group`, `Sequence`; *measured* in `three@0.187.0`). GSAP is a common alternative and "is now 100% free for all users" (https://gsap.com/pricing/; the page doesn't spell out commercial licence terms). `AnimationMixer` plays glTF clips.
- **Babylon.js:** Built-in `Animation`, keyframes, a dozen easing classes (`BackEase`, `BounceEase`, `ElasticEase`, `BezierCurveEase`…), `Animation.CreateAndStartAnimation`, animation events and `await animatable.waitAsync()` (https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations). Promise-based sequencing is a good fit for "Box closes, then Buffer drains".
- **PlayCanvas:** The core has `AnimComponent` for clip and state-graph animation (*measured* in `playcanvas.d.ts`). Tweening is a separate first-party library, `playcanvas/playcanvas-tween`, which offers an ESM build (https://github.com/playcanvas/playcanvas-tween). Its README doesn't confirm engine v2 compatibility.
- **Godot:** Built-in `Tween` (`create_tween()`, `tween_property()`, sequential by default, `parallel()`, ease/trans types) (https://docs.godotengine.org/en/stable/classes/class_tween.html). This is the most ergonomic option here.
- **Unity:** Animator and Timeline are built in. Code tweening usually uses a third-party package (DOTween, LeanTween), which I did not verify for this report.

### 2.6 glTF import from Blender

All five import glTF 2.0, and Blender exports it natively, so glTF/GLB works as a common format for any choice.
- Three.js: `GLTFLoader` is in `examples/jsm/loaders` (*measured*).
- Babylon.js: glTF 2.0 loader with Draco, meshopt and KTX2/Basis support (https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF).
- PlayCanvas: "designed to import content most faithfully via ... GLB" and recommends GLB from Blender with embedded textures (https://developer.playcanvas.com/user-manual/assets/models/building/, https://developer.playcanvas.com/user-manual/assets/models/exporting/).
- Godot: glTF 2.0 is "recommended". Direct `.blend` import works by calling a locally installed Blender to export glTF (https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html).
- Unity: imports FBX natively, with glTF via the glTFast package (not verified for this report).

For Peg Game, Part and Pin identity, covering relations and colours could travel as glTF node names or `extras` custom properties. Which one is a level-format decision, not an engine one.

### 2.7 Developer experience (TS / C# / GDScript)

- **Three.js:** JS with community types in `@types/three`, version-matched at 0.187.0 (*measured* via `npm view`). It's a library, not an engine, so you assemble scene, input, tweening and the PWA yourself. Largest ecosystem.
- **Babylon.js:** Written in TypeScript with first-party typings. Ships a Playground, Inspector and Node Material Editor. More "engine" than Three (cameras with input, animation, picking built in).
- **PlayCanvas:** First-party `.d.ts` in the npm package (*measured*). The Vite/npm engine-only setup is "the recommended set up", and there's a scaffolder, `npm create playcanvas@latest` (https://developer.playcanvas.com/user-manual/engine/standalone/). The optional cloud Editor is free for public projects only; private projects need a paid plan ($15/month Personal) (https://playcanvas.com/plans).
- **Godot:** Full editor, scene tree and GDScript. **C# is not an option for a web target** (§2.3). You'd build the PWA through Godot's export, not a web toolchain.
- **Unity:** C#, full editor. Slow web builds; the "Disk Size with LTO" setting "can take a long time" (https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/building-distribution/web-optimization-mobile.md). It's the heaviest toolchain for a one-Model puzzle.

### 2.8 Running game logic headless (solver and tests)

- **Three.js / PlayCanvas / Babylon.js:** The rules engine and solver can be plain TypeScript with no engine import, run under Node and a test runner. This is an architecture choice open to all three. Babylon also offers `NullEngine`, which "does not produce any rendering and can therefore be used in a Node.js or server-side environment" (https://doc.babylonjs.com/setup/support/serverSide). PlayCanvas ships a `NullGraphicsDevice` class (*measured* in `playcanvas.d.ts`). The solver and level generator can share code with the game directly.
- **Godot:** `--headless` ("Useful for servers and with `--script`") and `-s/--script` run GDScript without a window (https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html). Unit tests use add-ons (GUT, gdUnit4, not verified here). A heavy search-based solver in GDScript is likely much slower than in TS on V8 or in C#. That's judgement, not measured.
- **Unity:** `-batchmode -nographics -executeMethod` supports automation "such as continuous integration, performing Unit Tests" (https://docs.unity.com/en-us/engine/current/manual/unity-editor/command-line-arguments/editor). Pure C# rules could also be compiled into a plain .NET test project outside Unity.

## 3. Summary matrix

| | Three.js | Babylon.js | PlayCanvas | Godot 4.7 | Unity 6.6 |
|---|---|---|---|---|---|
| Engine payload (gz) | ~0.2 MB | ~0.7 MB tree-shaken | ~0.75 MB | several MB wasm | ~2–11 MB |
| iOS PWA blockers | none | none | none | single-thread OK; iOS stability history; Safari WebGL2 warning | WebGL2 OK; low-RAM caveat |
| WebGPU on web | yes (WebGL2 fallback) | yes | yes | no | opt-in |
| Pinch/orbit built in | OrbitControls | ArcRotateCamera | camera-controls script | manual | manual |
| Hold gesture | manual | manual | manual | manual | manual |
| Tweening | add-on (tween.js/GSAP) | built in, promise-based | add-on (playcanvas-tween) | built in (`Tween`) | Animator; tween via 3rd party |
| Language for web | JS/TS | TS | JS/TS | GDScript only | C# |
| Headless rules/solver | Node (plain TS) | Node + NullEngine | Node (plain TS) | `--headless` GDScript | batchmode / .NET |

## 4. Implications for the decision

The strongest candidates are below. This report does not pick one; that's for the grilling ticket.

1. **Three.js + TypeScript.**
   - For: smallest payload, no iOS blockers, WebGPU with WebGL2 fallback, and a rules engine and solver in plain TS under Node, shared with a future generator.
   - Against: you assemble the stack yourself (input recogniser for Peek, tween library, PWA plugin, scene structure). OrbitControls covers rotate and zoom; tap vs hold vs drag is custom code.
2. **Babylon.js + TypeScript.**
   - For: the same web and PWA advantages, plus more built in (pointer observable with picking and tap, ArcRotateCamera pinch, easing and `waitAsync` tween sequencing, NullEngine for tests). First-party TS.
   - Against: a payload roughly 3–4x Three's even when tree-shaken, and tree-shaking needs careful side-effect imports.
3. **Godot 4.7 (GDScript).**
   - For: best authoring experience for a 3D scene (editor, built-in `Tween`, `.blend` import, PWA export).
   - Against: GDScript only on the web (no C#), multi-MB wasm startup, WebGL2-only Compatibility renderer with a documented Safari WebGL2 warning, a recent history of iOS-specific crash and leak bugs, and a GDScript solver that is probably slower.

PlayCanvas is a close alternative to Babylon: similar size, first-party types, a camera-controls script with pinch. Its tween is a separate library, and its Editor is paid for private projects. Unity is the weakest fit: biggest download, heaviest toolchain, and mobile web support with a low-RAM caveat, all for a one-Model puzzle.

Key trade-offs for the grilling:
- **Payload and startup vs built-in features:** Three is the smallest, Babylon and PlayCanvas have more built in, and Godot has the best editor.
- **Where the solver lives:** a TS rules core is shared by the game, tests and the future generator in the JS options. Godot needs GDScript, or a separate solver in another language that has to stay in sync with the game rules.
- **iOS risk:** the JS libraries have no known blockers. Godot works single-threaded but needs early on-device testing on iOS Safari.
- **Language preference:** the user knows TS, C# and GDScript, but C# rules out the web for Godot 4 and points only to Unity.
