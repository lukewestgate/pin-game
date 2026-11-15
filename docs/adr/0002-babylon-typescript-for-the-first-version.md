# Babylon.js + TypeScript, with pure rules that emit events and an in-scene HUD

The first version is built on Babylon.js + TypeScript (WebGL2). We chose it over Three.js, which has a smaller bundle (about 0.2 MB against 0.7 MB) but leaves outlines, the Peek depth pre-pass, gesture handling and tweening to be built by hand. Babylon has all of these built in. We chose it over Godot web, the best editor and a language the developer already knew, because Godot's multi-MB WebAssembly, missing anti-aliasing options and iOS instability fit a mobile-first PWA badly.

Two structural choices are made alongside it. First, the rules engine is pure TypeScript with no engine or DOM imports, enforced by lint. `tap()` returns a new state plus a list of events, and rendering only plays those events, so the solver, tests and a future generator share the exact rules the player sees. Second, the Box row and Buffer are drawn inside the Babylon scene by an orthographic camera rather than as a DOM overlay, so a removed Pin flies to its Box as one continuous 3D object.

## Consequences

- Moving off Babylon later means rewriting `src/render` and `src/input`, but not the rules, solver or content.
- HUD layout (safe areas, small phones) is done in scene units and not with CSS. Only text, buttons and dev UI use the DOM.
- No hand-written GLSL, which keeps a later move to `WebGPUEngine` cheap.
