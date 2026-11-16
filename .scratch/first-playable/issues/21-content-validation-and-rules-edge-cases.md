# 21: Content validation and rules edge cases

**What to build:** Broken content can't load and the rules behave exactly as specified. A level author who writes a bad Model or Level gets an error naming the file and the offending Part or Socket id. Every edge case of the sorting rules is pinned by a named test. See [spec](../spec.md): Content format, Rules engine, Testing Decisions seam 1.

**Blocked by:** 20 (Walking skeleton).

**Status:** resolved

- [x] Cross-field validation runs after Zod parsing as plain functions: every Socket has a colour; each colour's total is a multiple of Capacity; covering has no loops; no Core covers a Socket; no Socket is covered by its own Part; ids are unique; the Model id exists.
- [x] One failing test per check (plus a bad Zod shape), each with an inline Model or Level. Each asserts that the error names the file and the Part or Socket id.
- [x] Named rules tests on tiny hand-built Levels, asserting both state and the exact event list: lose the moment the last Buffer slot fills; a grey Box when no colour qualifies; a drain → close → replacement chain; a Blocked tap refused with no change; taps after a win or loss refused; never two open Boxes of one colour; the reachable-first preference; a per-Level override (Buffer 6) takes effect; undo, including undoing a loss.
- [x] Seeded random playouts (no property-testing library) check after every tap: every Pin is in exactly one place; the Buffer never exceeds its size; open Box colours are distinct; replaying taps gives identical states and events; the next-colour pick is a pure function of (seed, pick number, state).
- [x] The Candy palette is a content constant, and Level colours reference palette indices.
