# 35: Device checklist

**What to build:** Confirm on real phones that the deployed first playable behaves as designed, and settle the iOS status-bar style before anyone installs it for keeps. See [spec](../spec.md): Further Notes, manual device checklist.

**Blocked by:** 34 (GitHub Pages deploy and CI).

**Status:** ready-for-human

- [ ] Decide the iOS status bar first: if `default` reads as an ugly white strip over the slate scene, switch to `black` before installing (any change to the tag costs a reinstall).
- [ ] Android install prompt appears, and the maskable icon looks right.
- [ ] iOS install: icon and name are right.
- [ ] Airplane mode, cold launch: the Level plays fully offline.
- [ ] A pushed change doesn't reload mid-Level, and is live after a win, a loss or on a fresh Level (the dev bar's version changes).
- [ ] Notched iPhone on iOS 26.1+: the Box row clears the status bar, and `100vh` fills the screen.
- [ ] Pinch, double-tap, pull-down and long-press cause no browser zoom, refresh, callout or selection.
- [ ] Rotate: Android stays portrait, and iOS shows the centred column.
- [ ] Silent switch on: no sound. Off: sounds mix over music already playing.
- [ ] Background the Home Screen app and return. Note whether sound is gone (WebKit bug 291892).
- [ ] Wood grain is readable and cheap enough on a phone (fallback: same colours, no texture).
- [ ] Taps feel accurate (otherwise run the gesture prototype's aim test and size `minTargetPx` from the 90th-percentile offset), and a 240 ms hold doesn't steal slow taps.
- [ ] Record findings as comments on this ticket, and open follow-up tickets for anything to tune.
