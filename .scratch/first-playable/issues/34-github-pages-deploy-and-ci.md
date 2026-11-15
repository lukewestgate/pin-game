# 34: GitHub Pages deploy and CI

**What to build:** Every push to `main` builds, checks and deploys Pin Game to GitHub Pages at `<user>.github.io/pin-game/`, and pull requests run `pnpm check`. This needs a human to create the remote and change repo settings; a `/wizard` can walk through those steps. See [spec](../spec.md): PWA, hosting and updates; PWA hosting ticket (15).

**Blocked by:** 32 (PWA: offline, install and safe updates).

**Status:** ready-for-human

- [ ] A public GitHub repo named `pin-game` is created and added as the remote (human).
- [ ] The repo's Pages source is set to "GitHub Actions" (human).
- [ ] One workflow: on push to `main`, it runs `pnpm install --frozen-lockfile`, then `pnpm build` (which runs `pnpm check`) with the base env var set to `/pin-game/`, then uploads and deploys the Pages artifact. On PRs, it runs `pnpm check` only. Node and pnpm versions come from `.nvmrc` and `packageManager`.
- [ ] A failing test, lint error, Prettier diff or unwinnable Level blocks the deploy.
- [ ] The deployed site loads, installs and works offline.
