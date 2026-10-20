# Story O3 — Only the builder edits

Make the stored builder the authority for puzzle editing, on the server and
in the library. Refuse another builder's editor URL using the existing
not-found page.

**Blast radius: high.** Changes to `src/app/puzzles/actions.ts` require an
implementation branch, independent verification, PR, and independent final
review/merge.

## Decisions

This story is specified from the current actions, editor route, library,
and frozen O1/O2 acceptance. The user authorized specification, new frozen
acceptance, implementation, independent verification, and delivery on
2026-10-18.

- Only the trusted `requireSession()` user's ID establishes ownership.
  Compare it with `Puzzle.builderId`; roles, supplied identity properties,
  publication, and visibility cannot grant another user edit access.
- Enforce ownership in the database predicate of each write, alongside
  existing eligibility predicates. A read followed by an unchecked write is
  insufficient. Denied/missing targets must reject without changing any
  puzzle field or timestamp and without successful-write revalidation.
  Error wording need not distinguish missing, foreign, or ineligible rows.
- `loadPuzzle`, the current editor loader, returns null for a missing or
  foreign puzzle. The existing route calls `notFound()`: no redirect, editor,
  read-only view, or disclosure of the foreign puzzle's title/answers.
  A builder can still load their own published puzzle to unpublish/delete it.
- Keep `listPuzzles` and the library unfiltered, including other builders'
  unpublished/private rows, as frozen O1 acceptance explicitly requires.
  This story governs editing; visibility/play access policy belongs to Play.
- Each library row visibly says **Your puzzle** or **Another builder's
  puzzle**, using the trusted session and returned `builderId`. Keep the
  existing Edit action only for the builder, including their published rows.
  Other rows have no action, link to an editor, or disabled/placeholder Play.
  *Correction (P5, human-approved 2026-10-20):* another builder's published
  row may offer Play's real controls (Play, reset of the player's own attempt)
  as [Play P5](../../11-play/stories/11-P5-library-play.md) defines; it still
  never links to the editor. Foreign unpublished rows keep no actions.
  No builder-name join is needed. Preserve size grouping, order, thumbnails,
  titles, dates, badges, and existing row/action hooks.
- Content writes (`saveGrid`, `saveHints`, `saveTitle`, `enterHints`) require
  `publishedAt: null` as well as ownership. Actual inspection found that
  `enterHints` lacked the write-time published guard despite the epic's
  summary; include it here. Preserve phase conversion, hints, and the one-time
  `gridBeforeHints` snapshot contract for owned unpublished puzzles.
- `publishPuzzle` retains its hints-phase/unpublished/visibility checks.
  `unpublishPuzzle` and `deletePuzzle` remain available to the builder for
  published and unpublished puzzles. The epic's published-lock summary does
  not prohibit these intentional existing owner operations.

## Required behavior

All seven existing mutations (`saveGrid`, `saveHints`, `saveTitle`,
`enterHints`, `publishPuzzle`, `unpublishPuzzle`, `deletePuzzle`) authenticate
before database access, use the session builder at write time, and reject
foreign or missing targets. Preserve successful owner behavior and return
shapes. For read-before-write `enterHints`, refuse foreign reads and ensure
the final write cannot proceed if ownership/publication no longer matches.
Do not accept caller-supplied builder authority or introduce alternate write
paths that bypass these checks.

Protect the editor loader for grid, hints, and published puzzles, whether
private or public. Keep signed-out session handling unchanged. There is no
new read-only editor or play route. Library ownership is computed on the
server; hiding Edit supplements the server guards.

## Non-goals and preservation

No schema/migration, ownership backfill/replay, role system, permission
framework, ownership transfer, co-builders, profile/name editing, invitations,
Play, hydration investigation, or serialization/engine changes. Preserve
existing puzzle/account data, inbox messages, and all prior acceptance tests.
Only ordinary isolated E2E resets and test fixtures are authorized. Do not
inspect/edit `.env*` files or perform production schema/data operations.

## Repo paths

New acceptance drafted under this user's specification authorization (the
explicit exception to STORY step 0a's relocation-only default), reviewed
together with this story and frozen on main before implementation:

- `src/app/puzzles/actions.builder-edits.test.ts` — trusted-session mutation
  boundaries, persisted effects, owner success, published locks, loader
  refusal, missing rows, and write-time ownership/publication enforcement.
- `e2e/builder-edits.spec.ts` — library distinction/actions, direct route
  refusal across puzzle states/visibility, unchanged foreign persisted data,
  and owner editing/published operations.

Editable implementation/plumbing:

- `src/app/puzzles/actions.ts`, `src/app/puzzles/page.tsx`, and if needed
  `src/app/puzzles/[id]/page.tsx` (its existing not-found behavior may suffice).
- `e2e/helpers/builder-edits.ts` — guarded isolated fixture/persisted reads,
  reusing existing helpers. Existing shared helpers only if needed; preserve
  their frozen consumers and target guards.
- `e2e/helpers/seed-session.ts`, `e2e/helpers/seed-puzzle.ts`, and a focused
  test-scoped fixture-identity helper if needed: the frozen A4 renewal test
  signs in a fresh fixture user then seeds a puzzle without an explicit
  builder. Bind that default seed to the same test's authenticated fixture
  builder; retain explicit ownership overrides and the shared suite default
  elsewhere. Never use a global last-user identity across tests or weaken
  runtime access checks to accommodate fixtures.
- This story, Ownership `EPIC.md` and maintained `HANDOFF.md`.

## Acceptance examples

1. Invalid sessions reject all seven writes and loading before data access.
   A validated non-builder cannot change/delete another puzzle with any of
   the seven actions; all fields/timestamps remain unchanged and no success
   revalidation occurs. Missing targets reject writes, not silently succeed.
2. The builder can save grid/hints/title, enter hints with the original-grid
   snapshot retained on repeat entry, publish eligible puzzles with either
   visibility, unpublish, and delete. Owned published content/transition
   writes reject; owned published load/unpublish/delete remain supported.
3. Mutation predicates constrain both ID and the actual session builder;
   content and publish predicates retain publication/phase constraints.
   `enterHints` rejects if ownership or publication changes after the read,
   with no transition write landing.
4. The editor loader returns null for foreign/missing puzzles and returns an
   owned puzzle with its existing serialized/deserialized metadata contract.
   A signed-in browser visiting foreign draft/hints/published public/private
   URLs sees the existing refusal, without the editor or puzzle title/grid.
5. Own and foreign puzzles remain in the same size-grouped library, with
   correct visible ownership labels. Only own rows have the editor link
   (`puzzle-edit-link`: Edit, or Manage on published rows per P5), including
   own published rows. Foreign draft rows have no actions; foreign published rows
   have no editor link (P5 correction above). Reload
   preserves this behavior and foreign data remains unchanged.
6. Own unpublished editing persists through the real browser flow; an own
   published puzzle opens locked, can be unpublished, and editing works again.
   Existing raw creation, name capture, session, and all earlier acceptance
   remain unchanged.

## Definition of done

1. Review this specification and both new acceptance files before freezing
   them in a specification-only commit on main. Demonstrate meaningful new
   acceptance failures before runtime changes. Branch
   `story/10-O3-builder-edits` from that baseline.
2. Separate implementation and verification agents; serialize shared E2E/build
   work. `npm run verify` and ordinary `npm run test:e2e` both exit 0.
3. Verify all prior acceptance and both new files byte-for-byte against the
   baseline. Bind independent verification evidence to the final runtime tree.
4. Update Ownership's maintained handoff, push/open PR, and obtain independent
   final review and normal reviewer merge after required local and configured
   checks pass for the reviewed head. Record deployment status separately.
5. As O3 is the final planned story, arrange a report-only Ownership closeout
   audit with an agent independent of its implementation; account for findings
   before marking the epic closed. Play remains unauthorized.
