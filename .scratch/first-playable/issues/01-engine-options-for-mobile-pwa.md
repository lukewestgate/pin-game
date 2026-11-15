# Engine options for a mobile-first 3D PWA

Type: research
Status: resolved
Parent: ../map.md

## Question

Which engines or libraries can ship a small 3D puzzle game as an installable, offline-capable PWA that runs well on mid-range phones (iOS Safari and Android Chrome) and on desktop browsers? Compare at least Three.js, Babylon.js, PlayCanvas, Godot 4 web export and Unity WebGL on:
- download size and startup time
- mobile GPU performance
- iOS Safari / home-screen PWA support and known blockers (e.g. Godot 4 needing SharedArrayBuffer/cross-origin isolation)
- handling of touch gestures (tap, drag, pinch, press-and-hold)
- tweening and animation support
- glTF import from Blender
- TypeScript/C#/GDScript developer experience
- ability to run game logic headless (for a solver and tests)

Findings go in `../research/01-engine-options.md`, with sources cited.

## Answer

Full findings: [research/01-engine-options.md](../research/01-engine-options.md).

- **Strongest candidates:** Three.js + TypeScript (about 0.2 MB gzipped, assemble it yourself), Babylon.js + TypeScript (about 0.7 MB tree-shaken, the most built in: picking, tap events, pinch on its orbit camera, promise-based easing animations, a headless NullEngine), and Godot 4.7 + GDScript (best editor and Tween, but several MB of WebAssembly to load and compile, WebGL2 only, Safari warnings, recent iOS crashes, no C# on the web, and a slower solver). PlayCanvas is close to Babylon. Unity is the weakest fit.
- None of them has a press-and-hold recogniser for Peek, so that's custom code everywhere.
- iOS 26 opens every Home Screen site as a web app. Safari 26 ships WebGPU. Godot's single-threaded web export (the default since 4.3) no longer needs special cross-origin headers.
- Unverified (flagged in the file): Unity 6.6's release and WebGPU status, pinch events in Godot's web build, Unity glTF and tween packages. The Three.js size is from Bundlephobia plus an unminified gzip measurement.
