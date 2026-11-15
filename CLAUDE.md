## Setup

Run `pnpm install` first, then verify with `pnpm check`. Use the `pnpm` scripts rather than `npx`, which downloads unrelated packages when dependencies are missing. A pre-commit hook (`.githooks/`, wired by `pnpm install`) runs `pnpm check`.

## Commit messages

Keep commit messages relatively concise, in this format:

```
<ticket ref> <short summary, under 50 chars>

<implementation details and specific choices, e.g. why this approach over another>
```
 
## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
