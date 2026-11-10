# Story S1 — The 12px label

The `label` text style becomes 12px on a 16px line everywhere it's used.
The hint answers keep their place under their lines, now a little
closer, and `TextInput` gains the caption under its line that S3 and S4
use.

**Status: Done 2026-11-09:** implemented 6804021, direct to `main`;
independent review: no blockers. Approved and frozen 2026-11-09 by the orchestrating session
under the human's delegation ([history](../HISTORY.md#orchestration)),
after an independent review of the draft (no blockers; its six
should-fix findings and nits addressed). The amendments to earlier
frozen acceptance, including the F2-1 retirement and D9-3 retarget, are
approved with it and committed in this freeze.

**Blast radius: small, off the risk paths.** One text style's values,
the Hint Box word's padding, the hint rows' spacing, a new optional
`TextInput` prop, the style guide. No server, schema, auth or
`src/engine/**` change. Direct delivery to `main`.

## The human's request

From the [EPIC](../EPIC.md#the-humans-request), item 3: `label` is 12px
(was 14px) everywhere it's used. The labels under the hint inputs may
need to move up so the gap between each label and its line doesn't
grow.

From the EPIC's Stories, S1: the hint labels and any other caption close
up to their lines. S3 and S4 build on S1 for the caption.

## What the code does today

- **The style:** `--text-label` 0.875rem (14px), weight 400, line
  height 1.25rem (20px), in `src/app/globals.css`; `text-label` applies
  all three.
- **Its uses** (every `text-label` in `src/`):
  - the hint answers under each Hint Input (`hint-answer`,
    `HintsPanel.tsx`): `mt-1`, right-aligned, `tracking-[0.1em]`,
    `muted` (`error` when missing, `primary` while its input has focus);
  - the Hint Box's word (`hint-box-word`, `HintBox.tsx`): beside the
    hint (or above it when narrow), `py-[5px]`, so its box is 30px, the
    same as the hint's field, and its text on the hint's first-line
    baseline; uppercase, `tracking-[0.1em]`;
  - the Preview toggle's label (`PreviewToggle.tsx`), Rebus's link look
    (`RebusControl.tsx`), Lock Word in the toggle row
    (`LockWordControl.tsx`), Reset Grid (`StartOverLink`,
    `StartOverDialog.tsx`);
  - every tooltip (`Tooltip.tsx`: 4px/8px padding, at most 280px wide):
    the Preview cells', the lock button's, the progress bar's;
  - a size group's dimensions in the library (`puzzle-group-dimensions`,
    `RowHeading.tsx`), not listed in the EPIC;
  - the style guide's catalog row (`TextStyles.tsx`: "14px · 400").
- **Measured on `main` (1440px, Chrome, Inter):** a hint answer's box
  starts 4px under its field's bottom edge and is 20px tall; the top of
  its capitals is **9.31px** under the line. Hint rows are 53px tall,
  5px apart: lines **58px apart**, the build skeleton's frame, so
  nothing moves at Create Hints (14-S6-5, frozen). The Hint Box word's
  baseline is the hint's, to the pixel. A one-line tooltip is 28px tall;
  the red Preview tooltip takes two lines (48px).
- **`TextInput`** (`src/components/ui/TextInput.tsx`): its `label` prop
  is a `title-4` heading *above* the field. No caption under the line;
  the hints' answers are their own `<p>`.

## Decisions

From the human:

- **`label` is 12px everywhere, weight unchanged** (400).
- **A label under a line sits no farther from it than today.**

From the EPIC ("proposed by the agent", approved):

- **Line height 16px** with the 12px size (`--text-label--line-height:
  1rem`).
- **The caption** is part of `TextInput`: `label` style, uppercase,
  `tracking-[0.1em]`, `muted`, right-aligned, under the line; the field's
  accessible name is the caption's text, so it isn't announced twice;
  the above-the-field `label` prop stays.

Delegated (orchestrating session, decided here):

- **Every use follows the style.** No use overrides the size or line
  height; each of the uses above renders 12px on a 16px line.
- **The hint answers keep their 4px box gap** (`mt-1`, frozen in 14-S6-4
  and 15-S6). With the 16px line the capitals close up from 9.31px to
  7.77px under the line (measured with the prototype): no farther, as
  asked, and not touching it. Acceptance holds them 7–9.4px under it.
- **The hint rows keep their 58px pitch.** The answer's line is 4px
  shorter, so the rows' gap grows from 5px to 9px (e.g.
  `not-first:mt-[9px]`): the lines stay where the skeleton has them and
  nothing moves at Create Hints (14-S6-5 unchanged). The answer stays
  with its own line, a little farther from the next row's.
- **The Hint Box word keeps its 30px box**, centered as 15-S4 froze it,
  and stays on the hint's first-line baseline (within 1px): its padding
  becomes 8px top, 6px bottom (was 5px each). Beside the hint or above
  it, nothing else moves.
- **Tooltips** keep their padding and 280px limit (23-S1-2 checks the
  limit): a line is 16px, so a one-line tooltip is 24px tall. The red
  Preview text ("Fill in these cells so the puzzle is symmetrical.") now
  fits on one line, but only just (261.2px of the 264px inside), so
  20-S2-3 as amended accepts one or two lines, its height following the
  count, rather than pinning 24px.
- **The controls** (Preview, Rebus, Lock Word, Reset Grid) and the
  dimensions change only their text; their rows, gaps and positions are
  otherwise unchanged (the full suite passed with the prototype below).
- **The caption is a new optional prop, `caption`**, in S1, so S3 and
  S4 only use it. It renders under the line (and above any error
  message; S4 is the first to show both, and checks it), its box
  starting 4px under the field's bottom edge like the hint answers', its
  right edge on the line's right end, `text-right`, in `muted`
  regardless of focus, error or disabled (23-S1-5 checks focus; the
  error and disabled states are checked in S4, which first shows them).
  It works with both sizes.
- **Not announced twice; the caption names the field.** With
  `caption`, the field's accessible name is the caption's text (its DOM
  text, not the uppercase rendering), and the caption itself is
  `aria-hidden`, so it is not a second node in the accessibility tree (a
  `<label>` alone would expose the text twice). In the prop types,
  `caption` and `aria-label` are mutually exclusive (a union: one or the
  other, never both, never neither), and `caption` and the above-field
  `label` can't be combined either, so exactly one thing names the
  field.
- **The hints keep their own answer markup.** A hint's answer is
  information about the word, not the field's name ("1 Across hint"),
  and it changes color with focus and errors; it isn't moved onto the
  caption.
- **The style guide** shows the caption: `sg-input-captioned`, large,
  caption "Username", a value (e.g. "Lil Orange Wing"), its caption
  `sg-input-captioned-caption`; its catalog row reads "12px · 400".

## Non-goals

- Any other text style; `label`'s weight or color.
- Restyling any control, tooltip or row beyond the size and line height
  (and the paddings above that keep their boxes).
- The username step and Account details, which first use the caption
  (S3, S4); the caption's look beside an error message (S4).
- Moving the hint answers onto `TextInput`'s caption.

## Acceptance (frozen 2026-11-09)

Viewport 1440px unless stated. Line heights and positions are read from
the page; a caption's cap top is derived from its line box and the
font's own metrics (canvas `measureText`), not read from pixels.

### `e2e/label-12px.spec.ts` (new)

1. **23-S1-1 the style:** an element with `text-label` resolves to
   12px, weight 400, 16px line height. The style guide's `label` row
   reads "12px · 400"; its sample is 12px on 16px.
2. **23-S1-2 every use is 12px** (400, 16px line): the hint answers (and
   their 1.2px tracking); the Hint Box word at 768px (1.2px tracking);
   in a daily's build phase the Preview label, Rebus, Reset Grid and the
   progress bar's tooltip (Preview on, hovering the bar; its computed
   `max-width` still 280px); Lock Word in
   the toggle row at 635px; a mini group's "5 × 5" in the library.
3. **23-S1-3 hint answers close to their lines:** in every row, the
   answer's box starts 4px under its field's bottom edge, is one 16px
   line, and its capitals are 7–9.4px under the line (9.31px on `main`,
   7.77px with the prototype).
4. **23-S1-4 the Hint Box word** (768px): 12px; its box 30px tall,
   level with the hint's field; its baseline within 1px of the hint's
   first line.
5. **23-S1-5 the caption** (`/style-guide`):
   - `sg-input-captioned` is one large (18px) text field in
     `sg-inputs`; its caption `sg-input-captioned-caption` reads
     "Username";
   - the caption is 12px/400/16px, uppercase, 1.2px tracking, `muted`
     (black at 40%), right-aligned; its box 4px under the field's bottom
     edge, its right edge on the field's; its capitals 7–9.4px under the
     line;
   - the caption stays `muted` while the field has focus;
   - the field's accessible name is "Username", its description empty;
     in the aria snapshot of the field's parent (`TextInput`'s root,
     which holds the caption), "Username" appears only as the
     textbox's name.

### Unchanged frozen acceptance that S1 must keep

- 14-S6-5 (`e2e/hint-phase-design.spec.ts`): lines 58px apart, nothing
  moves at Create Hints.
- 14-S6-4 and 15-S6 (`e2e/small-screens.spec.ts`): the answer 4px below
  its line, right-aligned with it.
- 15-S4 (`e2e/hint-box.spec.ts`): the Hint Box word vertically centered
  with the input, its size and line height read from the token.

### Amended acceptance

The human's request ("`label` is 12px, everywhere it's used")
authorizes amending frozen acceptance that pins `label` at 14px / 20px
or depends on it; each file gets a note citing 23-S1:

- `e2e/text-styles.spec.ts` (F2): `label` → `[12, 400]` (F2-1, F2-3).
  F2-1's "label replaces the old 12px label, so existing labels grow to
  14px" is **retired**: it would still pass (it reads `hint-label`, the
  number, `title-4` since 14-S6, which stays 14px) but asserts a
  reversed premise, so it no longer checks `label` at all. 23-S1-2
  replaces it.
- `e2e/toggle-radio.spec.ts` (F6-2): the Preview label 12px (was 14).
- `e2e/hint-phase-design.spec.ts` (14-S6-4): the answer 12px, 16px
  line, tracking 1.2px ("10% of 12px"; was 14px, 20px, 1.4px). Its
  4px gap and right alignment are unchanged.
- `e2e/preview-tooltips.spec.ts` (20-S2-3): 12px on 16px (was 14 on
  20); the gold tooltip 24px tall (was 28); the red one one or two
  lines (counted from the text's line boxes), 8px plus 16px a line (was
  two, 48px), still at most 280px wide.
- `e2e/tooltips.spec.ts` (22-S4-9): the bar's tooltip 12px on 16px (was
  14 on 20).
- `e2e/typography.spec.ts` (D9-3, "a hint-row label uses the label
  size"): reads `hint-answer` instead of `hint-label`. Not a size
  change: the check is token-relative, but the number it read is
  `title-4` since 14-S6 and would now fail; the row's text in the
  `label` style is its answer.

The edits are prepared in the working tree (uncommitted).

**Correction procedure (STORY §3):** the F2-1 retirement and the D9-3
retarget are semantic corrections of frozen acceptance, not size
updates. They are approved under the human's orchestration delegation
after this draft's independent review, and committed in S1's
specification-only freeze commit on `main`, not with the
implementation.

### Discrimination (2026-11-09, `main` at 84a75c1 + S2's 12b3828)

- `npm run test:e2e -- e2e/label-12px.spec.ts` on `main`: 12 failed, 1
  passed (setup). 23-S1-1 (14/20 resolved; "14px · 400"); 23-S1-2 (each
  14px: hint answer, Hint Box word, Preview label, Lock Word,
  dimensions); 23-S1-3 ("one 16px line": 20); 23-S1-4 (14px); 23-S1-5
  (no caption example; named `sg-input-caption` before the review).
- The seven files, new and amended, on `main`: 18 failed, 60 passed.
  Failing: the 12 new; 14-S6-4, 20-S2-3, F2-1 tokens, F2-3, F6-2,
  22-S4-9. Passing: D9-3 as amended (token-relative, and the answer is
  14px on `main`).
- **Throwaway prototype, reverted, not kept:** `label` 0.75rem/1rem;
  the catalog's 12; the Hint Box word `pt-[8px] pb-[6px]`; a `caption`
  prop (`<p aria-hidden>`, `mt-1 text-right text-label uppercase
  tracking-[0.1em] text-muted`, `aria-label` passed as "Username"); the
  style guide's example. First full `npm run test:e2e` (the hint rows
  still 5px apart): 1281 passed, 10 failed: the new spec passed; the
  six amended files' cases above; 14-S6-5's two (lines 54px apart; 4px
  moved at Create Hints), which led to the 58px-pitch decision; and
  18-S5-5 (`done-icon.spec.ts`, a corner pixel 3 off), which passed on
  a rerun and is unrelated. With the rows 9px apart and the amendments:
  the new spec, the amended files and `small-screens`, `hints-layout`,
  `hint-box`, `inputs`, `style-guide`, `hints-panel`, `done-icon`,
  `lock-tooltip`: all passed.
- **After the independent review** (in a separate git worktree, under
  the shared E2E lock): with the prototype, the new spec (now 13 cases:
  the caption's focus case added, the example renamed
  `sg-input-captioned`, the tooltip's `max-width`) and the seven files
  plus `inputs` and `style-guide`: 107 passed, 0 failed. The hint
  answers' capitals measured 7.77px under the line in every row; the red
  tooltip's text 261.2px wide of the 264px inside (one line, 2.8px
  spare), so its line count is asserted. Without the prototype (the
  runtime of `main`): the new spec 13 of 13 failed, the amended 20-S2-3
  failed (14px), 10 passed (setup and the rest of `preview-tooltips`).
- `npx eslint` on the seven test files and `npx tsc --noEmit`: clean.

## Repo paths

Acceptance: `e2e/label-12px.spec.ts` (new); amended
`e2e/text-styles.spec.ts`, `e2e/toggle-radio.spec.ts`,
`e2e/hint-phase-design.spec.ts`, `e2e/preview-tooltips.spec.ts`,
`e2e/tooltips.spec.ts`, `e2e/typography.spec.ts`.
Runtime: `src/app/globals.css`, `src/components/grid/HintBox.tsx`,
`src/components/grid/HintsPanel.tsx`, `src/components/ui/TextInput.tsx`,
`src/components/style-guide/TextStyles.tsx`,
`src/app/style-guide/page.tsx`.
Docs: this story, `../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path (`src/engine/**`,
`src/lib/puzzle-storage.ts`, `src/app/puzzles/actions.ts`,
`prisma/**`); the spec only imports `createBlankPuzzle` to seed. Direct
delivery to `main`. If the actual diff touches a risk path, it moves to
a branch and PR.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The orchestrator records the delegated decisions under HANDOFF's
  "Decisions for the visual check": the hint rows' 9px gap keeping the
  58px pitch; the hint answers closer to their lines (7.77px, was
  9.31px); the Hint Box word's 8px/6px padding; the red tooltip on one
  line; the caption hidden from assistive tech, naming the field in
  place of `aria-label`.
- The human's visual check at the epic's end: the 12px labels, the hint
  answers under their lines, the controls and tooltips.
