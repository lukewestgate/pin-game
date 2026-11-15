# PWA hosting, caching and updates

Type: grilling
Status: open
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
