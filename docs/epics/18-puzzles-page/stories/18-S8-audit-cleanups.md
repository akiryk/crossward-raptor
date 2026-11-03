# Story S8 — Audit cleanups

Two cleanups the closeout audit found and the human asked for ("Why can't
we fix both?"):

- `Radio`'s `nav` variant goes. Its only use since 18-S4 is the style
  guide's sample.
- Frozen-test header comments and describe titles that still describe the
  removed Build | Play views, the fixed icon or `[complete]` as current are
  corrected.

Nothing visible changes in the app, except that the style guide loses
its nav Radio sample.

**Status: done** (2026-11-02; implemented `6a5ddac`). Drafted under the orchestration the
human delegated on 2026-11-02 and extended to S5–S8 the same day (see the
[handoff](../HANDOFF.md)). An independent specification review approved
it with should-fix items, applied here: two more stale "Build row's menu"
headers (N9, N10), more explicit exclusions, two more runtime comments,
and nits. The original patches in `/tmp` were lost in a reboot; a
separate agent rebuilt them from this story. An independent
confirmation review on the rebuilt patches: **approve with should-fix**
(this record's failing utility, patch paths and current counts; applied
here), no blocker. The orchestrator approved the specification and the
amendments, including the semantic rows S1–S6, under the human's
delegation.

**Blast radius: small.**

- `Radio.tsx` loses the `nav` variant and the `variant` prop.
- The style guide drops its nav sample.
- Three runtime comments are corrected.
- Nine frozen test files are amended. In six of them only comments or
  titles change. In three, checks of the removed variant are removed. No
  assertion is added, and none of the kept checks changes.

No schema, server action, storage, query, engine or library-behavior
change.

**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). So this story is delivered
directly on `main`.

## What the code does today

I inspected `src/components/ui/Radio.tsx`, `src/app/style-guide/page.tsx`
and every `RadioGroup` caller (`src/components/puzzle/NewPuzzleDialog.tsx`,
`src/components/grid/PublishDialog.tsx`).
I grepped `src` and `e2e` for:

- `nav`, `variant`, `data-variant`, `sg-radio-nav`, `RadioVariant`
- `Build | Play`, `Build/Play`, `Build's`, `Play's`, `library-view`,
  `Play view`, `the views`
- `[complete]`, `fixed icon`, `CrosswordIcon`

### The `nav` variant

- `Radio.tsx` exports `RadioVariant = 'form' | 'nav'`. `RadioGroup`
  takes `variant = 'form'` and writes it to `data-variant`. Its comment
  says "`nav` is a row of blue choices (Build/Play)".
- `nav` has its own ring (`border-link-muted`), its own `title-4` labels
  (`text-button-active`, `text-link-muted`, `text-button-hover`) and a
  row layout.
- **Callers:** `NewPuzzleDialog` and `PublishDialog` pass no `variant`,
  so both are `form`. The only `variant="nav"` is the style guide's
  `sg-radio-nav` sample ("Build or play"). 18-S4 removed the library's
  `library-view` Radio and kept the variant "in the style guide"
  (18-S4's scope list).

### Frozen tests that pin the `nav` variant

- **`src/components/ui/radio-source.test.ts`**, "Radio uses only the
  redesign tokens", requires five nav-only utilities in `Radio.tsx`:
  `border-link-muted`, `text-title-4`, `text-button-active`,
  `text-link-muted` and `text-button-hover`.
  - Observed: with the variant removed (throwaway patch), this case
    fails at `border-link-muted`, the first nav-only utility it checks.
    The other two cases pass.
- **`e2e/toggle-radio.spec.ts`:**
  - F6-1 "… sg-radios shows a form and a nav Radio" checks
    `sg-radio-nav`'s two options and their Build/Play labels.
  - The whole F6-4 "nav Radio" describe (3 cases) runs on
    `sg-radio-nav`.
  - F6-7 "color transitions" includes the unselected nav label's color
    transition (`'nav radio label'`).
  - The header describes the `nav` variant.
- **`e2e/focus-ring.spec.ts`:**
  - 14-S11-2 "a form and a nav Radio option are ringed as a whole, …"
    loops over `sg-radio-form` and `sg-radio-nav`.
  - 14-S11-3 "clicking a Button, the toggle or a Radio option shows no
    ring" does the same.
- **`e2e/builder-controls.spec.ts:431`** expects the publish dialog's
  radiogroup to have `data-variant="form"`. S8 keeps that attribute, so
  this test is not amended.

`NewPuzzleDialog`'s and `PublishDialog`'s other tests don't pass or check
a variant.

### Stale comments and titles

| File | Where | Stale text |
| --- | --- | --- |
| `e2e/puzzle-library.spec.ts` | header, lines 17–35 | The Build/Play `nav` Radio and the rule as current. Build and Play as separate views kept in `localStorage`. "a fixed 34px crossword icon". "at most one `error` control … Reset on Play's completed ones". "Build's Delete". "Build's markers". |
| `e2e/puzzle-library.spec.ts` | describe titles | `'14-S2-3 Build'`, `'14-S2-4 Play'` |
| `e2e/puzzle-library.spec.ts` | lines 407, 528 | "status-icons.spec.ts keeps Play's" ("… whole"). Since 18-S5 it keeps only `[in-play]`. |
| `src/components/puzzle/library-source.test.ts` | header, lines 9–10 | "in favour of one fixed icon". 18-S3 replaced it with the status icon. |
| `e2e/status-icons.spec.ts` | header, lines 24–25 | "play rows keep `[in-play]` and `[complete]`". 18-S5 removed `[complete]`, as the next paragraph notes. S5's review left this for S8. |
| `e2e/status-icons.spec.ts` | header, line 30 | "Still within the Build \| Play views." |
| `e2e/puzzle-groups.spec.ts` | line 148 | "every row shows one fixed icon" |
| `e2e/delete-published.spec.ts` | header, line 12 | "The Build row's menu offers Delete …" |
| `e2e/duplicate.spec.ts` | header, line 14 | "Every Build row's menu offers Duplicate first." |
| `src/components/puzzle/LibraryDeleteDialog.tsx` (runtime) | line 8 | "Build's Delete confirmation" |
| `src/components/puzzle/library-row.ts` (runtime) | line 4 | "Play's right control (Reset)" |
| `src/components/puzzle/LibraryPlayControls.tsx` (runtime) | line 30 | "Play's Reset for a completed attempt" |
| `src/components/ui/Radio.tsx` (runtime) | line 15 | "`nav` is a row of blue choices (Build/Play)". It goes with the variant. |

## Decisions

### From the EPIC *(human, 2026-11-02)*

- Remove `Radio`'s now-unused `nav` variant.
- Correct the frozen tests' stale Build/Play headers and describe titles
  through STORY's correction procedure.

### Delegated decisions *(drafting agent, 2026-11-02; for the reviewer and the human's end-of-epic review)*

- **The `variant` prop goes too.** With one variant left, the prop and
  `RadioVariant` would select nothing. `RadioGroup` keeps
  `data-variant="form"` as a literal, so `builder-controls.spec.ts:431`
  holds unchanged.
  - Rejected: keeping `variant?: 'form'`. It is a prop with one value.
  - Rejected: dropping `data-variant`. It would amend one more frozen
    test for no gain.
- **The `form` look is unchanged:**
  - ring `border-line-dark`
  - label `text-body-small text-primary`
  - stacked `flex flex-col gap-3`
  - the 150ms transitions
  - the hover and focus ring colors
- **The style guide drops its nav sample** (`sg-radio-nav` and
  `navChoice`). `sg-radios` keeps the form sample. There is no other
  consumer.
- **F6-4 is retired, not retargeted.** Every check in it is nav-only: a
  row layout, link-muted, `title-4` labels and label hover/focus colors.
  F6-3 already covers the form Radio's ring, dot, hover, focus and
  selection. A retirement comment names its three cases, in the style of
  14-S2-5's.
- **F6-7 drops the nav label's row** instead of checking the form
  label. The form label's color never changes, so checking its
  transition would add a new assertion. The radio ring and dot rows still
  cover Radio's transitions.
- **The focus-ring loops keep their form group only.** They stay
  single-element loops, so the kept checks are byte-identical.
- **Two items beyond the audit's list are included**, because they come
  from the same removals and are comment-only:
  - `puzzle-groups.spec.ts:148` (fixed icon)
  - `puzzle-library.spec.ts:407/528` ("keeps Play's whole")

  The review added two more: the "Build row's menu" headers in
  `delete-published.spec.ts:12` and `duplicate.spec.ts:14`.

  The runtime comments in `LibraryDeleteDialog.tsx:8`,
  `library-row.ts:4` ("The completed row's right control (Reset)") and
  `LibraryPlayControls.tsx:30` ("The library Reset for a completed
  attempt") are corrected in the implementation. They need no correction
  procedure.
- **History is kept, not erased.** The headers describe today's page.
  14-S2's radio, views and fixed icon are named once, as history.
- **Describe titles keep their case ids:**
  - `'14-S2-3 Build'` becomes `'14-S2-3 the caller’s puzzles'`
  - `'14-S2-4 Play'` becomes `'14-S2-4 published puzzles'`

### Explicitly excluded *(accurate dated history, unchanged)*

- **The "18-S4: one list, so no Play view to choose" notes** in:
  - `delete-published.spec.ts` (308, 418)
  - `modal-design.spec.ts` (426)
  - `no-play-reset.spec.ts` (82)
  - `unlisted.spec.ts` (84)
  - `row-menu.spec.ts` (563)
  - `library-play.spec.ts` (73)
  - `builder-edits.spec.ts` (13)
  - `puzzle-library.spec.ts`: 321–322, 373–377, 403–405, 553–555,
    603, 622, 642 and the 14-S2-5 retirement note at 712–717
- **`library-filters.spec.ts`:** its header ("One list replaces the
  Build | Play radio") and 18-S4-3's title ("… with no Build | Play
  choice"). 18-S4-3 asserts that `library-view` is absent.
- **`focus-ring.spec.ts:296`** ("a filter checkbox replaces the
  Build/Play Radio").
- **Dated 16-S2/14-S2 history that 18-S4 notes already update:**
  `row-menu.spec.ts:8–16` (its "Build row" header ends with "18-S4: one
  list; the caller's own rows have the menu …") and
  `builder-edits.spec.ts:10–12` (14-S2's Build and Play lists, followed by
  its 18-S4 note).
- **"Play" read as the play side or the Play icon, not the view:**
  `no-play-reset.spec.ts:12` ("a completed Play row"),
  `modal-design.spec.ts:419` ("on a completed Play row") and
  `puzzle-library.spec.ts:448` ("16-S2: Build's Delete moved into the row
  menu", dated history).
- **`library-source.test.ts`:** 23 (`replaces CrosswordIcon.tsx`) and
  100 (`one list replaces the Build | Play views`).
- **The `[complete]` notes:** `status-icons.spec.ts:446`,
  `library-play.spec.ts:97` and all of `done-icon.spec.ts`.
- **`PuzzleRowMenu.tsx:36`.**
- **Past stories' records** (13-F6, 14-S2, 14-S11 and 18-S4's "its `nav`
  variant stays in the style guide"). They are historical, and S8
  supersedes them.
- **S6 and S7 files** (`narrow-margin`, `hint-preview-alignment`) and
  `hint-phase-design` and `build-grid-design`. None of them has
  Build/Play-view text.

## Acceptance

*Approved and frozen.* No new test file. The amended frozen tests are the
acceptance, together with these checks:

1. `grep -rnE "'nav'|variant=\"nav\"|RadioVariant|sg-radio-nav|navChoice" src e2e`
   finds nothing.
2. Every amended file's diff against the freeze commit is limited to the
   rows of the amendment table.
3. `npm run verify` exits 0.
4. The full `npm run test:e2e` exits 0. Its count is the suite on S7's
   commit minus 3 (F6-4). Like for like on `2921834` (without S7's
   untracked spec): 960 listed before, 957 after. On `351b137` (S7
   delivered): 990 before, 987 after.
5. Runtime diff:
   - `Radio.tsx`: the nav removal only. Every class the form variant
     renders is unchanged.
   - The style-guide page: the sample removal only.
   - `LibraryDeleteDialog.tsx`, `library-row.ts` and
     `LibraryPlayControls.tsx`: comment only.

### Amended acceptance

Committed in a separate specification-only commit on `main` before any
runtime change. The edits, rebuilt after the `/tmp` originals were lost,
are kept at `~/.crossward-patches/18-S8-spec-amendments.patch`, which
applies cleanly to `351b137` (`git apply --check`).

**Non-semantic** (comments and titles only; no check changes):

| # | File | Case | Was | Becomes | Reason |
| --- | --- | --- | --- | --- | --- |
| N1 | `e2e/puzzle-library.spec.ts` | header | the nav Radio, the rule and the stored Build/Play views as current; "a fixed 34px crossword icon"; "at most one `error` control … Reset on Play's completed ones"; "Build's Delete"; "Build's markers" | today's heading and `data-ready` (on hydration); 14-S2's radio, rule and views named once as history replaced by 18-S4; "the icon"; "any play marker"; the row menu on own puzzles and Reset on completed ones; "The row's link covers the row …"; "the build markers"; an 18-S5 `[complete]` note | stale since 18-S3, 18-S4 and 18-S5 |
| N2 | `e2e/puzzle-library.spec.ts` | describe `'14-S2-3 Build'` | `'14-S2-3 Build'` | `'14-S2-3 the caller’s puzzles'` | the Build view is gone (18-S4) |
| N3 | `e2e/puzzle-library.spec.ts` | describe `'14-S2-4 Play'` | `'14-S2-4 Play'` | `'14-S2-4 published puzzles'` | the Play view is gone (18-S4) |
| N4 | `e2e/puzzle-library.spec.ts` | notes before "the text block …" and "a long title truncates …" | "status-icons.spec.ts keeps Play's" / "keeps Play's whole" | "keeps `[in-play]`" | `[complete]` removed (18-S5) |
| N5 | `src/components/puzzle/library-source.test.ts` | header | "in favour of one fixed icon" | "in favour of an icon (14-S2's one fixed icon; 18-S3's status icon)" (rewrapped) | the status icon (18-S3) |
| N6 | `e2e/status-icons.spec.ts` | header | "play rows keep `[in-play]` and `[complete]`"; "Still within the Build \| Play views." | "play rows keep `[in-play]` (and kept `[complete]` until 18-S5, below)"; "18-S3 was written within the Build \| Play views." | 18-S5 removed `[complete]`; left for S8 by S5's review |
| N7 | `e2e/puzzle-groups.spec.ts` | note before "edit sits beside its title …" | "every row shows one fixed icon" | "every row showed one fixed icon …, since 18-S3 the status icon" | the status icon (18-S3) |
| N8 | `e2e/toggle-radio.spec.ts` | header | describes the `nav` variant; "(ring, and nav label)" | form only; "on its ring"; an 18-S8 note naming the removed checks | the variant is removed |
| N9 | `e2e/delete-published.spec.ts` | header | "The Build row's menu offers Delete on published rows too, …" | "The row menu (on the caller's own rows; 14-S2's Build rows until 18-S4) offers Delete on published rows too, …" (paragraph rewrapped) | the Build view is gone (18-S4) |
| N10 | `e2e/duplicate.spec.ts` | header | "Every Build row's menu offers Duplicate first." | "Every row menu (on the caller's own rows; 14-S2's Build rows until 18-S4) offers Duplicate first." (paragraph rewrapped) | as above |

**Semantic** (checks of the removed `nav` variant are removed; nothing
is added; every kept check is unchanged):

| # | File | Case | Was | Becomes | Reason |
| --- | --- | --- | --- | --- | --- |
| S1 | `src/components/ui/radio-source.test.ts` | "Radio uses only the redesign tokens" | requires 14 utilities, including `border-link-muted`, `text-title-4`, `text-button-active`, `text-link-muted`, `text-button-hover` | requires the 9 form utilities; a comment names the 5 removed; the header has an 18-S8 amendment note | they exist only in the `nav` variant. Observed failing at `border-link-muted` with the variant removed. |
| S2 | `e2e/toggle-radio.spec.ts` | F6-1 "sg-toggles shows an off and an on Preview toggle; sg-radios shows a form and a nav Radio" | checks `sg-radio-form` (4) and `sg-radio-nav` (2), and the nav labels Build, Play | renamed "… sg-radios shows a form Radio"; checks `sg-radio-form` (4) only | the nav sample is removed |
| S3 | `e2e/toggle-radio.spec.ts` | F6-4 "nav Radio" (3 cases: "options sit in a row; …", "hover turns an unselected ring and label button-hover; …", "clicking the other option moves the selection and its colors") | 3 cases on `sg-radio-nav` | retired; a comment names the 3 cases | the variant is removed |
| S4 | `e2e/toggle-radio.spec.ts` | F6-7 "buttons, the toggle, Radio and links change color, …" | 8 rows, including `'nav radio label'` | 7 rows; a comment notes the removed row | as above |
| S5 | `e2e/focus-ring.spec.ts` | 14-S11-2 "a form and a nav Radio option are ringed as a whole, also after an arrow key; the circle is not" | loops over form and nav | renamed "a form Radio option is ringed as a whole, …"; loops over form only | as above |
| S6 | `e2e/focus-ring.spec.ts` | 14-S11-3 "clicking a Button, the toggle or a Radio option shows no ring" | loops over form and nav | loops over form only (title unchanged) | as above |

### Observed while drafting (2026-11-02)

The work was done in a detached worktree (at `2921834`; rebuilt at
`351b137` in an isolated worktree after a reboot lost the first).
It was isolated because another agent was running the shared e2e suite.
No browser suite, dev server or database was used.

- **Throwaway runtime**, rebuilt at `~/.crossward-patches/18-S8-throwaway.patch` (`Radio.tsx`,
  the style-guide page, and the `LibraryDeleteDialog.tsx`,
  `library-row.ts` and `LibraryPlayControls.tsx` comments). It is made
  against `2921834`, and it and the amendment patch apply cleanly to the
  `main` tree (`git apply --check`), including S6's uncommitted runtime
  edits.
  - With the runtime patch and the amendments:
    - `npx tsc --noEmit` exit 0.
    - `npm run lint` exit 0. The only warning is the existing `reqJson`
      unused-variable one.
    - `npx vitest run` passes 656 of 656.
  - With the runtime patch and without the amendments: frozen
    `radio-source.test.ts` fails 1 of 3 (at `border-link-muted`).
  - With the amendments on today's runtime: `radio-source` and
    `library-source` pass 7 of 7, and `tsc` exits 0. The amendments only
    remove checks, so they hold on both runtimes.
- **`npx playwright test --list` (no browser)**, like for like on
  `2921834` without S7's untracked spec: 960 tests before the
  amendments, 957 after; on `351b137`, 990 and 987. The difference is
  the 3 F6-4 cases.
- The amended e2e cases have not been run in a browser. They are subsets
  of frozen cases that pass today, but the full suite still has to run
  them on the implementation.

## Repo paths

Acceptance (immutable after freeze), the amended files:

- `e2e/puzzle-library.spec.ts`
- `e2e/status-icons.spec.ts`
- `e2e/puzzle-groups.spec.ts`
- `e2e/delete-published.spec.ts`
- `e2e/duplicate.spec.ts`
- `e2e/toggle-radio.spec.ts`
- `e2e/focus-ring.spec.ts`
- `src/components/ui/radio-source.test.ts`
- `src/components/puzzle/library-source.test.ts`

Runtime:

- `src/components/ui/Radio.tsx`: remove `nav`, `RadioVariant` and the
  `variant` prop, and keep `data-variant="form"`.
- `src/app/style-guide/page.tsx`: remove the `sg-radio-nav` sample and
  `navChoice`.
- `src/components/puzzle/LibraryDeleteDialog.tsx`: the line 8 comment
  only.
- `src/components/puzzle/library-row.ts`: the line 4 comment only.
- `src/components/puzzle/LibraryPlayControls.tsx`: the line 30 comment
  only.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S8. These stay out of scope:

- The form Radio's look or behavior.
- Other style-guide samples.
- Any library behavior.
- S6 and S7 files, and the specs named under Explicitly excluded.
- Past stories' records.
- Shared skills.

## Definition of done

- An independent specification review approves this story and its
  amendment table (done: approved with should-fix, applied).
- The semantic rows S1–S6 are approved under the human's delegation.
  They follow from the human-approved nav removal (EPIC S8), as S5's
  18-S3 amendments followed from removing `[complete]`. The reviewer
  agreed with this reading. The orchestrator approves under that
  delegation, and the approval is recorded here and in the handoff.
- The amendments are frozen on `main` in a specification-only commit,
  before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main`, with the handoff updated with observed results.

## Pending questions

None. The approval of S1–S6 is settled (see Definition of done). The
other choices are routine, reversible calls, recorded under Delegated
decisions: dropping the prop, the literal `data-variant`, retiring F6-4,
dropping the F6-7 row, the extra stale comments and the new titles.
