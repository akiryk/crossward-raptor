# Code review

This repo reviews the plan and the tests, not usually the implementation.
Story docs are the spec; acceptance tests are frozen and can't be edited to
match an implementation. That covers behaviour well.

It does not cover whether the code is duplicated, dead, or doing things the
story never asked for. `PuzzleGrid.tsx` sat orphaned for two stories while
`PuzzleGridEditor` duplicated its layout container, and every test passed
throughout. That's the gap this document addresses.

## When review applies

By blast radius, not by default. A story gets a PR and a review if it
touches any of:

- `src/engine/**` — pure logic every layer depends on
- `src/lib/puzzle-storage.ts` — the serialization format. Every stored
  puzzle is locked into it; changing it later means migrating real data.
  This is the closest thing here to a database schema, and the Prisma
  schema itself is not, since `grid` and `hints` are opaque `Json`.
- `src/app/puzzles/actions.ts` — Server Actions: the write path
- `prisma/**` — schema and migrations

`/story` checks this twice. First, against the story doc's stated "Repo
paths," before implementation starts — so a story already known to be
risky begins on a branch rather than partway through on `main`. Second,
against the actual `git diff`, after implementation and before anything is
pushed — this is the check that matters. A story doc can omit a path the
implementation legitimately needs to touch: Story D3's Repo paths named no
`src/engine/` file, but its implementation exported a function from
`src/engine/phase.ts`, and because only the doc-based check existed at the
time, the story shipped straight to `main`, unreviewed. If the real diff
touches one of the four paths above, the story goes to a PR regardless of
what the doc said.

Everything else merges straight to `main` as before. UI and styling work is
recoverable and cheap to redo; adding a review gate there buys little and
costs momentum.

## Who reviews

A different agent from the one that wrote the code — a different vendor if
possible. The value is independence, not capability: an instance of the
same model tends to share the blind spots of the one that produced the
diff.

## What to look for

Things the tests cannot catch:

- **Orphaned or dead code.** A component, export, or file no longer
  imported by anything. Has happened here.
- **Duplicated logic.** The same computation implemented twice, especially
  a layout or derivation copied rather than shared.
- **Scope beyond the story.** Changes to files the story's "Repo paths"
  didn't name, or behaviour it didn't ask for. Legitimate sometimes, but
  it should be flagged and explained, never silent.
- **Contradicting a stated decision.** Story docs have a Decisions
  section. An implementation that quietly does the opposite of one is a
  real finding, even with green tests.
- **Serialization changes.** Any change to how a puzzle is written or
  read. Ask specifically: can existing stored puzzles still be loaded?
- **Purity violations in the engine.** Functions that mutate inputs, hold
  state between calls, or reach for the DOM or a database client.
- **A test that can't fail.** See `docs/LEARNINGS.md` entry 6. If an
  assertion would pass whether or not the behaviour exists, say so.

## What not to comment on

Noise is what kills review adoption. Do not raise:

- Style, formatting, or naming preferences. Lint owns those.
- Suggestions to add abstraction, configurability, or error handling the
  story didn't ask for. `AGENTS.md` rule 2 says write the minimum that
  solves the stated problem; "you could generalize this" is against
  convention here, not for it.
- Missing tests for behaviour outside the story's scope.
- Anything already recorded as a deliberate decision in the story doc, the
  epic, or `docs/LEARNINGS.md`. Read those first.
- Speculative performance concerns at this scale. This app has one builder
  and dozens of puzzles.

If there is nothing worth raising, say so in one line. An empty review is a
valid result and better than a padded one.

## Output

A short list of findings, each with a file:line reference and a sentence on
why it matters. Order by significance. Separate anything that blocks merge
from anything that's merely worth knowing.
