# Epic: Ownership

Epic 09 establishes who a user is. This one establishes what is theirs.

Before this epic, puzzles had no recorded builder and anyone signed in
could edit anything. Before puzzles can be played by people who didn't
build them, the app has to know who built what — and the library has to
show the difference.

---

## Decisions

**`Puzzle.builderId` is a required foreign key.** Existing local-development
puzzles are deleted; the four production puzzles are preserved and assigned
to the user's existing successful-sign-in account.

A nullable owner would put "or no builder" into every query and
permission check forever, for the sake of a handful of rows in a
personal dev database. The test database is wiped on every run; disposable
local dev data includes "Sparky Pluggy" and friends.
The user explicitly confirmed on 2026-10-15 that existing local-development
puzzles may be deleted for this migration. This does not cover deployed data
or account records. On 2026-10-17 the user explicitly confirmed preserving
all four production puzzles and assigning them to the existing account used
for successful production sign-in. Preserve every pre-existing puzzle column,
including IDs, contents, publication fields, and timestamps. Identify that
account and the exact four puzzle IDs explicitly before production application;
do not infer an owner from the first/only user or silently adopt extra rows.
The migration must fail without data changes if its nonempty-table backfill
inputs do not match. Account records and development inbox messages are
preserved everywhere. A builder with puzzles cannot be deleted through the
foreign key; use `ON DELETE RESTRICT`, not cascading puzzle deletion.
Required from the start keeps epic 11's permission logic to a single
comparison with no null branch.

**The display name is asked for when it is first needed.** A user who
only ever plays never has one. The first time someone without a name
clicks New Puzzle, they're asked; it's stored, and they're never asked
again. This makes having a name a precondition of creating a puzzle,
which the new-puzzle flow has to handle — one more state in a dialog
that already has several. For O2 this is a UI prerequisite: the existing
authenticated raw creation action retains its frozen contract. Name saving
itself is authenticated and targets only the session user.

**Only the builder edits.** Enforced in the Server Actions, not only in
the UI. `saveGrid`, `saveHints`, `saveTitle`, `enterHints`,
`publishPuzzle`, `unpublishPuzzle` and `deletePuzzle` constrain writes to
the signed-in builder. Content writes also require an unpublished puzzle;
publishing retains its hints-phase/unpublished checks. Builders can still
unpublish or delete their own published puzzles. Inspection for O3 found
that `enterHints` also needs its published guard at write time.

**The check is a comparison, not a system.** "Is this puzzle's
`builderId` the signed-in user's id?" No permission tables, no role
checks, no general authorization layer. When moderators or an admin
role genuinely exist, the shape of that check will follow from what they
need to do — guessing now would be the speculative abstraction
AGENTS.md rule 2 prohibits.

**A non-builder reaching an editor URL is refused, not redirected to a
read-only view.** There is no read-only editor, and inventing one here
would duplicate what play mode is about to become. Refusal can soften
once epic 11 gives them somewhere better to land.

## Non-goals

- **No play access rules.** Who can *play* what is epic 11. This epic is
  only about who can *edit*.
- **No roles doing anything.** `role` still exists and is still unread.
- **No profile page.** The display name is captured, not editable yet.
- **No transfer of ownership**, no co-builders, no sharing.
- **No author attribution in the UI beyond the library list.** Showing
  "by <name>" on a puzzle itself is part of play.

---

## Stories

### O1 — Puzzles have builders

`builderId` as a required FK to the user, local-development puzzles deleted
and the four production puzzles preserved/backfilled as decided above,
`createPuzzle` recording the signed-in user. `listPuzzles` returns it so
the list can tell yours from everyone else's.

*Prisma and Server Actions — high blast radius.* The user confirmed on
2026-10-15 that existing local-development puzzles are disposable, and on
2026-10-17 approved the production-preservation/assignment policy above.

### O2 — Display names

`displayName` captured the first time a user without one creates a
puzzle. The prompt lives in the new-puzzle flow, which already uses
`Modal`, and once stored the flow is exactly as it is today.

Specified in [O2 — Display names](stories/10-O2-display-names.md). The user
confirmed on 2026-10-17: idle dismissal cancels without saving or creating;
the separate name step saves immediately before title/size; names are trimmed
1–80 Unicode code points and need not be unique; the UI prerequisite preserves
the raw creation contract. Canceling after a successful name save retains it.
There is no profile editor or schema migration.

### O3 — Only the builder edits

Ownership guards in the Server Actions, mirroring the published-lock
pattern. The editor route refuses a non-builder. The library
distinguishes puzzles you built from puzzles you didn't — which, until
epic 11, means a puzzle someone else published shows no action at all.

Specified in [O3 — Only the builder edits](stories/10-O3-builder-edits.md).
Retain the unfiltered library required by O1, including other builders'
drafts. Label each row as yours or another builder's and show Edit only
on your own rows. The existing not-found page refuses foreign editor URLs.
No play or visibility-access policy is introduced here.

---

## Suggested order

O1, O2, O3. O1 is the migration everything else needs; O2 and O3 are
independent of each other and could swap.

## Definition of done (epic-level)

Per story: acceptance examples encoded as tests and passing,
`npm run verify` exits 0, and `npm run test:e2e` exits 0.

A signed-in user can create a puzzle, is asked for a display name the
first time and never again, sees their own puzzles distinguished from
others' in the library, and cannot edit a puzzle they didn't build —
including by URL.
