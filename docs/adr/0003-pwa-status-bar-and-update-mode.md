# iOS status bar `default` and `prompt` updates applied at a safe moment

The first deploy ships `apple-mobile-web-app-status-bar-style: default`, not the full-bleed `black-translucent`. With `black-translucent`, the Box row at the top depends on `env(safe-area-inset-top)`, and an open WebKit bug makes that read 0 on iOS 26.1 and later, so the Boxes would sit under the notch. The tag can't be added or changed cheaply later: installs made without it get the wrong `100vh`, and installs only pick up a change after a reinstall. Switching to `black-translucent` once WebKit fixes the bug is allowed, at the cost of that reinstall.

The service worker uses `vite-plugin-pwa`'s `prompt` mode, which is painful to switch after launch, rather than `autoUpdate`, which reloads open tabs and would wipe a level in progress. The game shows no prompt. It applies a waiting update itself at a safe moment: before the first tap of a level, or once a win or lose banner is showing.
