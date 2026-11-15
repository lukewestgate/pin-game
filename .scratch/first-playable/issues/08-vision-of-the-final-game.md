# Vision of the final game

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 05, 06

## Question

What does the final game look like, and what must the first version leave room for? A sequence of Models getting harder (more colours, more Parts, deeper covering), endless procedural levels, level select and saved progress, player undo and boosters, sound, a possible future app-store wrapper, **player-facing hardness sliders** driven by the rule numbers (Boxes, Capacity, Buffer, colours, Pins per colour, next-colour rule), and a Blender import plus a custom editor for placing Sockets (the shape field's glTF mesh variant, see How Models and Parts are built), and possibly a player-visible next-Box preview (which would need the rule to commit to colours in advance, as a queue). Turn this into a short vision section for the spec, listing the extension points the first version's design has to keep open.

Note: Tech stack added two extension points. A later move to Babylon's WebGPU engine (kept cheap by writing no raw GLSL), and pure-TS `rules`/`solver`/`content` modules that a generator or CLI can import headless.

Note: Car level design set the first level's target at a 60–80% random-tap win rate (the game should feel mindless and relatively easy), on Buffer 6 as a per-level override. It named these difficulty levers for later levels: the spare wheel covering the tailgate (a 3-deep stack), more inner Parts or cross-links, Buffer 5 (the default), and more colours. Its colour-dealing script is a seed of the future generator.

## Answer

Resolved with the human on 2026-11-15 (grilling). The vision is written up in [vision.md](../vision.md), ready to lift into the spec. The glossary gained **Campaign**, **Pack**, **Booster** and **Endless mode**, as future terms. No ADR: nothing here is hard to reverse yet.

- **Shape:** a hand-made Campaign is the backbone, with Endless mode (generated on the device) alongside it. The tone stays relaxed: a gentle ramp with occasional hard spikes.
- **Models:** a random spread of subjects, with optional themed Packs as well. Each Model hosts many Levels (different deals and rule numbers), so volume comes from deals.
- **Hardness sliders:** Endless mode only. Campaign Levels are fixed, because each is proven winnable only for its own numbers.
- **Boosters and undo:** candidates are limited undo, +1 Buffer slot, and remove any Pin. A Booster is a pure rules action with the same shape as `tap`. Rule numbers that change mid-level move into state when the first Booster needs it.
- **Next-Box preview:** a later `"queue"` variant of the next-colour rule, which stays a named, swappable strategy.
- **Saving:** local only in the first version, behind a progress store interface, so accounts and cloud sync can come later. Stable ids, `formatVersion` on files, and no mid-level state saved across formats.
- **Level editor:** a separate tool (a second Vite entry in the same package, reusing `content`, `rules`, `solver` and the Model scene builder). It builds Models (primitives or glTF import, click to place Sockets, auto-filled covering), deals Levels against a target band, and shows **live difficulty**: the solver's verdict plus the random-tap win rate labelled against the band (secondary stats: share of winning first taps, deepest Buffer use), recomputed in a cancellable Worker after each edit.
- **Campaign order:** `data/campaign.json`, an ordered list of Level ids with a target random-tap band per slot.
- **Store wrapper:** a maybe-later (Capacitor). **Monetisation:** not planned, and nothing is designed for it.
- **Extension points:** twelve, listed in vision.md, each tied to the first-version decision that keeps it open.
