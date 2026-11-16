# Issue tracker: GitHub

Issues and specs for this repo live as GitHub Issues on `<owner>/pin-game`. Use the `gh` CLI for all operations.

History: tickets 01–35 of the first playable were tracked as markdown under `.scratch/first-playable/`. Those files stay in git as a record and are no longer edited; open work was migrated to GitHub Issues.

## Conventions

- Triage state is a GitHub label (see `triage-labels.md` for the role strings).
- Implementation issues and specs are issues; a spec issue is titled `Spec: <feature>`.
- Comments and conversation history are issue comments.

## When a skill says "publish to the issue tracker"

`gh issue create --title "..." --body-file <file> --label <role>`

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --comments`. The user will normally pass the number or URL.

## Wayfinding operations

Used by `/wayfinder`. The **map** is an issue; each **child** ticket is an issue linked to it.

- **Map**: an issue titled `Map: <effort>` with the Notes / Decisions-so-far / Fog body.
- **Child ticket**: an issue with the question in the body. Record the ticket type (`research`/`prototype`/`grilling`/`task`) as a `Type:` line in the body.
- **Blocking**: a `Blocked by: #N, #N` line near the top of the body. A ticket is unblocked when every issue it lists is closed.
- **Frontier**: `gh issue list --state open`; pick issues that are unblocked and unclaimed, lowest number first.
- **Claim**: add the `claimed` label (create it if missing) before any work.
- **Resolve**: comment the answer, close the issue, then append a context pointer (gist + link) to the map issue's Decisions-so-far.
