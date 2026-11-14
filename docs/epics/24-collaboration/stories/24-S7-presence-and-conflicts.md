# Story S7 — Presence, the session panel and conflicts

Builders see who else is in the puzzle. Each open editor's catch-up request
is also its heartbeat, and a tab being closed says so. A session activity
panel animates in between the controls and the grid when a second builder
is there, with timestamped notes of the session's meaningful events: joins,
leaves, another builder moving the puzzle to Create Hints or starting over,
and work of mine that another builder's commit replaced. Replaced work
gets a red outline that fades in and out, on the entry or the cells, or a
brief highlight on a hint's input, by the D2 rule. Routine remote edits
stay silent, and nothing changes anyone's cursor, direction or focus. The
four-screen scenario and the rest of the two-user browser tests close the
epic's "Multi-user testing" table.

**Status: approved and frozen 2026-11-14** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S7: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** A migration (`PuzzlePresence`), the catch-up
read and its route, a new presence route, `src/app/puzzles/actions.ts`,
`src/lib/collab/**` and the editor's save path (`editor-saver.ts`). Branch
`story/24-S7-presence-and-conflicts`, stacked on S6's branch (PR #44, which
merges first), a PR into `epic/24-collaboration` and independent review.

## The human's request

[EPIC](../EPIC.md): the human's request 2 to 5; Stories item 7;
"Multi-user testing" (S7's cells); D2; D4 and D5 (the notes); D8 (join
notes, panel placement and behavior, clue conflicts, same account, routine
changes); Implementation details "Presence" and "Start Over"; "The
four-screen scenario"; Invariants 9 and 11; the mockups
[02](../assets/02-jay-joins.png) and [04](../assets/04-magic-wins.png).

## What the code does today

`story/24-S6-collaborator-management` at `ffdd44e` (S6, PR #44).

- The editor polls `GET /api/puzzles/[id]/operations` about once a second
  while visible (`CatchUpPoller`); an answer is the operations since its
  confirmed version (`status: 'ops'`, each operation with its envelope and
  version), the snapshot, `published`, `not-found` or `invalid`. Nothing
  says who committed an operation, and nothing records who has the puzzle
  open.
- Remote operations rebase the view silently (`EditorSaver.caughtUp`,
  `showRemote`); a remote Start Over or Enter Hints first finalizes the
  draft, whose refusal is explained by S3's notices (`SaveNotices`, between
  the controls and the grid).
- The log records each operation's `userId`; usernames are
  `User.displayName`.

## Decisions

From the EPIC (not restated): the heartbeat rides on the catch-up request;
present within about 15 s; an explicit leave on closing; one entry per
account; join and leave notes from changes to the present set; D2's rule
and its 3 s window; the outline's fade (about 1–2 s); D8's notes and panel
placement; same account, two tabs: no alerts; routine changes silent; local
view state never touched (Invariant 9).

Drafting decisions (made under the delegation):

1. **Presence storage: one new table** (migration
   `20261114120000_add_puzzle_presence`, additive). `PuzzlePresence`:
   `puzzleId`, `clientId` (the tab), `userId`, `expiresAt`; primary key
   `(puzzleId, clientId)`; index `(puzzleId, expiresAt)`; cascades on the
   puzzle's and the user's deletion. A serverless deployment has no shared
   memory, so presence needs a row.
2. **Heartbeat.** A catch-up GET carrying the tab's `x-client-id` header
   (the `IDENTIFIER` shape) is a heartbeat, recorded only when the read
   answers `ops` or `snapshot` (so only for a builder who can edit an
   unpublished puzzle): the tab's row is created, or its `expiresAt` moved
   to now + 15 s (`PRESENCE_WINDOW_MS`) when fewer than 10 s are left, so a
   visible tab writes about every 5 s, not every second. Creating a tab's
   row also deletes the puzzle's rows expired more than an hour ago.
3. **What the answer carries.** With the header, and only when the read
   answers `ops` or `snapshot`, the JSON gains:
   - `present`: the **other** accounts with an unexpired row that can still
     edit the puzzle (`editableBy`), once each, as
     `{ userId, username }`, ordered by username then ID. The caller's own
     account (any of its tabs) is never listed.
   - `authors` (only when `ops` is non-empty): `{ [opId]: { userId,
     username } }` for each operation whose log record has a user.
   Without the header the answer is exactly as before (the frozen S4 tests
   and old tabs). Idle and alone, an answer is `{"status":"ops","ops":[],
   "present":[]}`, still under S4's 100-byte measure.
4. **Away and leave.** A new route `POST /api/puzzles/[id]/presence`
   (action `updatePresence({ puzzleId, clientId, state })`), sent with
   `keepalive`:
   - `away`, when the tab is hidden: its row's `expiresAt` becomes now +
     5 min (`AWAY_WINDOW_MS`). Polling stops while hidden (S4), so without
     this a builder switching tabs would leave and rejoin. A hidden tab
     costs no requests, and a forgotten one leaves after 5 minutes. (The
     EPIC's 15 s window is a tunable; this is its recorded adjustment for
     hidden tabs.)
   - `leave`, on `pagehide`: the row is deleted.
   Both act only on the caller's own row (`userId` in the `WHERE`) of a
   puzzle the caller can edit; anything else is `not-found` (404) or
   `invalid` (400), and changes nothing.
5. **Join and leave notes** (client, `PresenceNotes`). The first answer
   with presence sets the baseline: if others are there, "You joined. Adam
   is here." ("Adam and Kim are here.", "Adam, Kim and Lee are here."); if
   not, nothing. After that an account appearing gives "Jay joined the
   session."; one gone gives "Jay left the session." only once it has been
   absent for 5 s (`LEAVE_GRACE_MS`), so a reload (leave, then a new tab's
   heartbeat) makes no notes. A username missing reads "A builder".
6. **Notes for others' structural operations.** An operation from another
   account, arriving by catch-up: Enter Hints → "Jay moved the puzzle to
   Create Hints." (D4); Start Over → "Adam started over." (D5). Refused
   edits keep S3's notices (the reason and the copyable input) and are not
   repeated in the panel. A snapshot catch-up carries no authors, so it
   makes no notes or conflicts.
7. **The D2 rule, for the grid** (`src/lib/collab/conflict.ts`, pure).
   - My latest burst: when a `cells` burst is queued, the saver records its
     writes, its orientation (the cursor's), its entry (the word holding
     its cells in that orientation, in the projection with it applied:
     `intendedGeometry`'s words in Build, the grid's in Hints) and when it
     completed. A newer burst replaces it; its refusal clears it.
   - It is **recent** while the cursor is on one of its entry's cells, and
     for 3 s (`CONFLICT_WINDOW_MS`) after it completed.
   - A catch-up's operations supersede it when, for a cell it wrote, the
     last `cells` operation in the batch writing that cell is another
     account's (not this tab's, not my account's other tabs), the cell
     showed my value before the batch, and shows a different one after.
   - Then the entry's (or, see below, the cells') outline shows, and the
     panel notes, by the last such operation's author:
     - the entry is still the same word (same cells and number) after:
       "Jay changed 2-Down from MASKS to MAGIC." (the entry as shown before
       and after; an empty cell reads "?");
     - otherwise (its number or shape changed): "Jay changed 3 letters you
       just typed in 2-Down." ("a letter"; the entry named as it was before,
       or no "in …" when it had none), and the superseded cells are
       outlined one by one.
   - Edits on my pending (unacknowledged) cells aren't conflicts for me:
     my operation commits later and wins.
8. **The D2 rule, for hints** (D8). My latest hint burst (its key and
   text) is recent while the cursor is in that entry and for 3 s after. A
   catch-up's `hint` operation for that key from another account that
   replaces my text (shown before) with another highlights that hint's
   input (the list's and the Hint Box's) and notes "Jay changed your hint
   for 2-Down." The title is not covered (D8 names clues only).
9. **The outline.** An absolutely placed red rectangle (`--palette-cell-
   error`, 2 px) over the entry's cells in the grid
   (`data-testid="conflict-outline"`), as the lock outlines are placed. It
   fades in over 400 ms, holds 1.5 s and fades out over 500 ms (2.4 s),
   then is removed; with reduced motion it shows for 2.4 s without fading.
   A hint's highlight is the same red as a 2 px ring on its input
   (`data-conflict="true"` on the hint row and the Hint Box), same timing.
   Neither takes focus, moves the cursor, changes the direction or blocks
   typing.
10. **The panel** (`src/components/grid/SessionPanel.tsx`,
    `data-testid="session-panel"`, `role="log"`). It is absent until the
    session's first note, then animates in (its height and opacity, 300 ms;
    none with reduced motion) and stays for the page's life, published or
    lost included.
    - Place: under the step and toggle rows, above S3's notices and the
      grid, in Build and in Create Hints alike (D8: under the Preview row,
      and under Lock Grid Letters), at the grid's left and the toggle row's
      width; the grid keeps its distance below it (36 px where the lock
      button has room, else 16 px).
    - Look (mockups 02 and 04): white, a 1 px `line-muted` border, the
      modal radius and a soft inner shadow at the top; 16 px padding. A
      date heading ("Nov 8, 2026", `text-label`, semibold, subtle;
      `data-testid="session-date"`) before the first note and before any
      note on a new day. Each note (`data-testid="session-note"`): its time
      ("10:22", 24-hour local, `text-label`, subtle,
      `data-testid="session-note-time"`), then the text (`text-body-normal`,
      primary, `data-testid="session-note-text"`).
    - A fixed height of 128 px: a new note never moves the grid. Past that,
      it scrolls, kept at the newest note at the bottom.
11. **Who the editor is.** The editor page passes the session's account ID
    (`userId`), which the saver compares with operation authors.
12. **What stops it.** Access lost or published: no more heartbeats; the
    panel and its notes stay. A collaborator removed from the puzzle drops
    out of others' `present` at once (decision 3's `editableBy`), so their
    editors note that they left.

## Non-goals

- Remote selections or cursors (EPIC, out of this epic).
- Showing which builder made routine edits; an edit history.
- Push transport, avatars, colors per builder, a list of present builders
  outside the notes.
- Moving S3's refusal notices into the panel (decision 6).
- Title conflicts (decision 8).
- Changing the commit path, the catch-up's answer without the header, the
  polling cadence or S3–S6's frozen behavior.

## Acceptance (frozen)

IDs in `describe` names. `*.db.test.ts` run against the local test
database in throwaway schemas (S1 decision 11).

### Database (`npm run verify`)

1. `src/lib/collab/presence.db.test.ts` — **24-S7-1 the presence store**
   (`heartbeat`, `markAway`, `leave`, `presentBuilders` over a passed
   client and a passed `now`):
   - a heartbeat makes the tab present; other accounts see it once per
     account however many tabs, with its username; its own account never
     sees itself;
   - present until 15 s after the last write; a heartbeat with more than
     10 s left writes nothing; one with less extends it;
   - `away` keeps it present for 5 minutes; `leave` removes only that tab;
     neither touches another account's row;
   - an account removed from the puzzle isn't present, even with an
     unexpired row; rows expired over an hour are pruned when a tab's row
     is created.
2. `src/app/api/puzzles/[id]/operations/route.session.db.test.ts` —
   **24-S7-2 presence through the routes** (the session gate real, Better
   Auth's session read stubbed):
   - a GET with `x-client-id` records the heartbeat and answers `present`
     (Jay sees Adam, Adam sees Jay) and `authors` for the operations
     returned; without the header the answer has neither field and nothing
     is recorded;
   - a GET for a puzzle the caller can't edit records nothing; a published
     puzzle's answer has no `present`;
   - `POST /api/puzzles/[id]/presence` with `away` and `leave` acts on the
     caller's own tab; a malformed body is 400, a puzzle the caller can't
     edit 404, and neither changes anything.

### Unit (`npm run verify`)

3. `src/lib/collab/session.test.ts` — **24-S7-3 join and leave notes, and
   the panel's times:** decision 5's baseline, join, leave after the grace
   and no notes for a reload within it; names joined with commas and
   "and"; "A builder"; `formatNoteTime` ("09:05", "22:41") and
   `formatNoteDay` ("Nov 8, 2026").
4. `src/lib/collab/conflict.test.ts` — **24-S7-4 the D2 rule:** MASKS then
   MAGIC (the note and 2-Down's cells); MAG gives MAGKS; still recent with
   the cursor in the entry after 3 s; recent within 3 s after moving away,
   not after; the same value, an unrelated cell, my own other tab's
   account, this tab's operation, or a later operation of mine on the cell
   raise nothing; a changed shape gives the cells' note and outline; the
   hint rule.
5. `src/components/grid/editor-saver.session.test.ts` (Node, the page's
   globals stubbed, the commit action mocked) — **24-S7-5 the saver's
   session:** the catch-up asks with `x-client-id`; presence answers become
   notes; a remote MAGIC over my acknowledged MASKS reports the outline and
   the note and leaves the cursor; another account's Enter Hints and Start
   Over make their notes, my own account's make none; hidden sends `away`
   and `pagehide` sends `leave` (keepalive), and after access is lost
   nothing more is sent.

### Browser (`npm run test:e2e`)

6. `e2e/session-panel.spec.ts` with `e2e/helpers/session.ts`; Adam is the
   suite's builder, Jay the second seeded account (made a collaborator in
   the database):
   - **24-S7-E1 joining:** Adam's editor alone has no panel; Jay opens the
     puzzle: Adam's panel appears between the toggle row and the grid, with
     today's date heading and "HH:MM Jay joined the session.", and Jay's
     says "You joined. E2E Suite Builder is here."
   - **24-S7-E2 leaving:** Jay closes his page; within a few seconds
     Adam's panel adds "Jay left the session." and stays.
   - **24-S7-E3 notes don't move the grid:** with the panel shown, more
     notes than fit leave the grid where it was and the newest visible.
   - **24-S7-E4 Create Hints and Start Over:** Jay moves the puzzle to
     Create Hints: Adam's panel notes it and sits under the Lock Grid
     Letters row; in another puzzle, Adam's Start Over gives Jay "E2E Suite
     Builder started over."
   - **24-S7-E5 same account, two tabs:** two of Adam's contexts sync with
     no panel and no outline.
7. `e2e/conflicts.spec.ts` — the four-screen scenario and the rest:
   - **24-S7-E6 MAGIC wins (screens 1–4):** ABRAHAM in 1-Across; Adam types
     MASKS down from the M, saved; Jay's grid shows it, and Adam has no
     outline or new note; Jay types MAGIC over it; within a few seconds
     Adam's grid shows MAGIC, 2-Down's outline shows and then goes, the
     panel adds "Jay changed 2-Down from MASKS to MAGIC.", Adam's cursor is
     still on the last cell, Down, with focus on the grid, and his next
     letter types there; Jay never sees an outline.
   - **24-S7-E7 MAGKS:** Jay types only MAG: "… from MASKS to MAGKS."
   - **24-S7-E8 unrelated edits:** Jay changes 1-Across while Adam types in
     an unrelated word: both persist; no outline, no note.
   - **24-S7-E9 reconnecting:** Jay types a word, goes offline, Adam edits
     another word, Jay comes back: both words persist, Jay has no outline
     or conflict note.
   - **24-S7-E10 a hint:** in Create Hints, Adam writes 1-Across's hint and
     stays in it; Jay replaces it: Adam's hint input shows the new text and
     the highlight, and the panel notes "Jay changed your hint for
     1-Across."

### Discrimination

Recorded at the freeze against the baseline (`ffdd44e` with
`epic/24-collaboration` merged, `a47dba0`; no S7 runtime), with the files
above: 5 files failed, 5 tests failed and 1 passed
(`/tmp/s7-discrimination.log`).

- Fail without the runtime: 24-S7-1 to -4 (their modules and the presence
  route don't exist; nothing records or reads presence, notes or
  conflicts), and 24-S7-5's cases (the catch-up isn't sent as the tab, no
  notes, no outline, no presence posts).
- 24-S7-5's "a remote edit to cells I didn't just write is silent" pins
  behavior that must survive the change, and passes on the baseline.
- The baseline doesn't type-check with them (the new modules are missing).
- Every browser case needs the runtime (no panel, no outline, no
  `PuzzlePresence` table for the helpers).

### Correction (2026-11-14, after the freeze)

Two consequences of decisions 1 and 4 on earlier frozen tests were missed
at the freeze; the first verify run with the runtime found them. Neither
assertion's meaning changes beyond what the decisions require; each file
gets a note citing 24-S7.

- `src/app/route-guard-source.test.ts` (23-S3-U7, amended by 24-S1 and
  24-S4): the list of route handlers gains
  `app/api/puzzles/[id]/presence/route.ts`, and a new case pins that it
  imports only `next/server` and `@/app/puzzles/actions` and only calls the
  checked `updatePresence` action, as the commit route is pinned.
- `src/lib/collab/membership-migration.db.test.ts` (24-S5-8): "is the
  newest" becomes "is among them", since S7's migration follows it (as
  24-S5 amended 24-S1-15); the rest is unchanged and now applies S7's
  migration too.
- Lint only: `src/lib/collab/conflict.test.ts` loses an unused helper.

A separate specification-only commit on `epic/24-collaboration` ("24-S7:
amend …"), made under the human's delegation; the PR's independent
reviewer reviews it.

## Implementation

Runtime on `story/24-S7-presence-and-conflicts` (stacked on S6's
`ffdd44e`, `epic/24-collaboration` merged in): `812c8d2`, then `1d5df64`.
Frozen at `f4a0225`, amended at `b8fd5e6`; the acceptance files are
unchanged since (`git diff b8fd5e6 HEAD` over every acceptance file in
this story: no change).

- **Migration** `20261114120000_add_puzzle_presence` (one table, additive):
  applied to the local development and test databases only; `prisma
  migrate diff` against the development database shows no difference
  from the schema. Production is the human's, after S1's and S5's.
- `src/lib/collab/presence.ts`: `heartbeat` (an `updateMany` only when
  fewer than 10 s are left, else `createMany … skipDuplicates`, which
  prunes on a new row), `markAway`, `leave` (the caller's `userId` in each
  `WHERE`), `presentBuilders` (unexpired, not the caller, still owner or
  collaborator), `readSession` (heartbeat, present, authors by `opId`) and
  `updatePresence`. The `catchUpOperations` action adds the session only
  for a valid `clientId` and an `ops` or `snapshot` answer; the GET passes
  `x-client-id`; `POST /api/puzzles/[id]/presence` wraps
  `updatePresence`.
- `src/lib/collab/session.ts` (`PresenceNotes`, `operationNote`, the
  formats) and `src/lib/collab/conflict.ts` (`recordBurst`, `recordHint`,
  `leftEntry`, `isRecent`, `gridConflict`, `hintConflict`), pure.
- `EditorSaver`: the catch-up sent as the tab; presence notes on every
  answer; `noticeSession` after applying a catch-up's operations (notes
  for others' Enter Hints and Start Over, then the grid and hint rules)
  only when the answer named authors; `flushGrid` and `flushHints` record
  the latest burst and hint, `cursorMoved` marks leaving, a refusal clears
  them; hidden sends `away`, `pagehide` `leave`, unless published, lost or
  signing out.
- UI: `SessionPanel.tsx`; `useOperationSaving` keeps the notes, the
  outlines and the highlighted hints (each removed after 2.4 s);
  `PuzzleGrid`'s `conflicts` overlays; `HintsPanel`'s `conflictKeys` and
  `HintBox`'s `isConflict` (`.conflict-ring`); `globals.css` holds the
  keyframes; the editor page passes the session's account (`viewerId`
  from `loadPuzzle`).
- **A regression found and fixed:** `hint-box.spec.ts` 15-S4-2 failed at
  `812c8d2` (alone too): the Hint Box's class became a template literal
  with `py-[6.5px]${…}`, which Tailwind's scanner reads as one token, so
  the padding class wasn't generated. A space before the interpolation
  fixes it (`1d5df64`); the spec then passed (20/20).

### Evidence

- `npm run verify` at `1d5df64`: exit 0, 112 files, 1282 tests
  (`/tmp/s7-verify-1d5df64.log`).
- Browser, after `npm run pretest:e2e`'s reset, at `1d5df64`, one run
  `--workers=2`: this story's `session-panel` and `conflicts` and the
  directly affected `live-sync`, `editor-operations`,
  `collaborator-management`, `collaborators`, `editor-layout`,
  `hints-layout`, `hint-box`, `hints-panel` and `step-controls`: 112
  passed, exit 0 (`/tmp/s7-e2e-1d5df64.log`). Not the full suite (STORY,
  Verification, the epic-branch exception); one clean full run is owed on
  the final epic branch.
- S4's idle-answer measure (under 100 bytes) still holds: its 24-S4 case
  in `live-sync.spec.ts` passed with the heartbeat's `present` field.

### What the tests catch

2026-11-14, one risk-path rule disabled at a time and restored, the unit
and database files of S4–S7's catch-up, presence and saver each time
(`/tmp/s7-rules.log`).

| Rule disabled | Failing |
| --- | --- |
| Heartbeat recorded whatever the catch-up answered (not-found, published) | 24-S7-2 |
| Session fields added without the tab header | 24-S7-2 ×3, 24-S4-9 ×2 |
| Present: a removed builder still listed | 24-S7-1 |
| Present: the caller's own account listed | 24-S7-1, 24-S7-2 |
| Present: expired rows listed | 24-S7-1 ×2 |
| Heartbeat writes on every poll | 24-S7-1 |
| Away and leave act on another account's tab | 24-S7-1, 24-S7-2 |
| Presence update without the editable check | 24-S7-2 |
| Presence posts after access is lost | 24-S7-5 |
| Conflicts from my own account's other tabs | 24-S7-4 ×2 |
| Conflicts from this tab's own operations | 24-S7-4 |
| D2: no 3 s limit after leaving the entry | 24-S7-4 ×2 |
| D2: the cursor staying in the entry ignored | 24-S7-4 ×5 |
| D2: a cell not showing my value still counts | 24-S7-4 |
| D2: the batch's last writer not considered | 24-S7-4 |
| My own account's Enter Hints and Start Over noted | 24-S7-5 |
| A leave noted at once (no grace) | 24-S7-3 |

Not caught: **a refused burst kept as recent.** Redundant with the rule
that a cell must show my value before the batch: after a refusal the
grid shows the authoritative cells, never the refused letters, so the
stale burst can't match.

Not tested by disabling (UI-only): the panel's place, look, fixed height,
scrolling and entrance; the outline's and highlight's look and timing;
the note wording beyond the cases above. The browser cases pin them.

## Visual checks for the human (at the end of the epic)

The browser tests run with reduced motion and pin behavior, not looks:

1. The panel's look (border, radius, inner shadow, date heading, times)
   against mockups 02 and 04, wide and narrow, in Build and Create Hints.
2. The panel's entrance animation.
3. The conflict outline's fade in, hold and fade out, and a hint's
   highlight.

## Repo paths

Acceptance: the files above. Runtime: `prisma/schema.prisma`,
`prisma/migrations/20261114120000_add_puzzle_presence/`,
`src/lib/collab/{presence,session,conflict,notice,catchup,poller}.ts`,
`src/app/puzzles/actions.ts`, `src/app/puzzles/[id]/page.tsx`,
`src/app/api/puzzles/[id]/operations/route.ts`,
`src/app/api/puzzles/[id]/presence/route.ts`,
`src/components/grid/{editor-saver.ts,useOperationSaving.ts,PuzzleGridEditor.tsx,PuzzleGrid.tsx,HintsPanel.tsx,HintBox.tsx,SessionPanel.tsx}`,
`src/app/globals.css`. Docs: this story, `../EPIC.md` (the story link),
`../HANDOFF.md`, `docs/CODE-REVIEW.md` only if a new risk path needs
naming.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0; this story's browser files and the directly
  affected ones pass (STORY, Verification, the epic-branch exception).
- Which tests catch each risk-path rule (one disabled at a time),
  recorded; UI rules listed as not tested by disabling.
- The migration applied to the local development and test databases only;
  production is the human's, before `main`.
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer after PR #44.
