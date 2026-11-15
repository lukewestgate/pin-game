// The one place Babylon's side-effect modules are imported (ADR 0002). Every other file imports
// the side-effect-free `*.pure` modules, so tree-shaking keeps only what's registered here.
// Lint rejects non-pure `@babylonjs/core` imports anywhere else.
import '@babylonjs/core/Engines/engine';
import '@babylonjs/core/scene';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Culling/ray'; // scene.pick
