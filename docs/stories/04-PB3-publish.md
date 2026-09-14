# Story PB3 — Publish and unpublish

Third slice of the publishing epic. A puzzle can be published, which marks
it finished, and unpublished, which undoes that. Publishing carries a
visibility: private by default, public if the builder chooses at the moment
of publishing.

**Changing visibility after publishing is deliberately not in this story.**
"Only the builder can make their puzzle public" needs to know who the
builder is, and puzzles have no owner and visitors have no identity. That
becomes a story after authentication lands. Until then, visibility is
chosen once, when you publish.

**High blast radius** — `prisma/`, `actions.ts`. Branch and PR.

Repo paths:
- `prisma/schema.prisma` — edited: `publishedAt`, `visibility`
- `src/app/puzzles/actions.ts` — edited: `publishPuzzle`, `unpublishPuzzle`
- `src/lib/stepper.ts` — edited: publish becomes reachable
- `src/lib/stepper.test.ts` — **rewritten** (**already provided — do not
  edit**)
- `src/components/grid/PublishControls.tsx` — new
- `src/components/grid/Stepper.tsx` — edited: renders the controls
- `src/lib/puzzle-storage.ts` — edited only if the stored shape needs it
- `e2e/publish.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```prisma
model Puzzle {
  // ...existing fields
  publishedAt DateTime?
  visibility  String    @default("private")   // "private" | "public"
}
```

```ts
// src/app/puzzles/actions.ts
export type Visibility = 'private' | 'public';

export async function publishPuzzle(
  id: string,
  visibility: Visibility
): Promise<{ publishedAt: Date; visibility: Visibility }>;

export async function unpublishPuzzle(id: string): Promise<void>;
```

```ts
// src/lib/stepper.ts (signature widened)
export function stepStates(args: {
  phase: Phase;
  hintsComplete: boolean;
  isPublished: boolean;
}): readonly Step[];
```

## Decisions

**Publishing requires hints phase, and that isn't a quality gate.** The
epic's governing principle is that no *quality* check blocks publishing —
not symmetry, not completeness, not word count. Requiring hints phase is a
different kind of rule: entering hints phase is what converts empty cells
to black and fixes the geometry, so a grid-phase puzzle simply hasn't got
final geometry yet. Publishing one would publish a shape nobody will ever
see. Sequencing, not judgment.

**Private by default, chosen at publish time.** The control is a checkbox
beside the publish button, checked by default, reading as keeping the
puzzle private while testing. Unchecking it before publishing makes it
public. There is no way to change visibility afterward in this story — see
above.

**Private means unlisted, not protected.** A private puzzle won't appear in
any browse list; anyone holding its URL can open it. Puzzle IDs are
`cuid()` — long, random, non-sequential — so nobody guesses one. This is
obscurity rather than access control, which is a deliberate and adequate
choice for a crossword.

**That choice has a standing consequence worth recording.** Private only
means anything as long as the browse list is the only way to discover a
puzzle. Anything that later enumerates puzzles — a sitemap, a public API
route, a "recently published" feed — silently undoes it. Whoever builds
such a thing must filter by visibility.

**Visibility has no observable effect yet, and that's expected.** No
solver-facing browse list exists, so nothing currently filters on it. The
field is stored, returned, and displayed; filtering arrives with the play
epic's browse view. Don't invent a list here to give it something to do.

**Publishing lives in the stepper's publish step**, beside PB2's readiness
panel. That step exists precisely to represent this moment, and the panel
is already the thing a builder consults before deciding.

**`stepStates` gains `isPublished`**, so the stepper can show where the
puzzle actually is. Its committed tests are rewritten accordingly — the
current ones assert publish is always unavailable, which this story makes
false.

## Markup contract

Inside the publish step, alongside `readiness-panel`:

- `data-testid="publish-button"` — publishes. Absent when already
  published.
- `data-testid="private-checkbox"` — checked by default, with a visible
  label. Absent when already published.
- `data-testid="unpublish-button"` — shown only when published.
- `data-testid="publish-state"` — visible text reporting the current
  state: unpublished, or published with its visibility.

## Scope discipline

- **No changing visibility after publishing.** Needs auth.
- **No solver-facing browse list and no filtering by visibility.** Play
  epic.
- **No read-only enforcement on published puzzles.** PB4.
- **No published status in the builder's list.** PB5.
- **No auth, no ownership, no user model.**
- **No changes to `src/engine/`.**

## Acceptance examples

**PB3-1 — `stepStates` (Vitest)**
- Grid phase: publish is `unavailable`, with a reason.
- Hints phase, unpublished: publish is `available`, with no reason.
- Hints phase, published: publish is `current`, and clues reports
  `complete`.
- Grid phase is unaffected by `isPublished` — a puzzle can't be published
  from there anyway.
- Every `unavailable` step still carries a non-empty reason; no other
  status does.
- Always three steps in order; purity holds.

**PB3-2 — publishing (Playwright)**
- On an unpublished hints-phase puzzle, the publish step shows
  `publish-button`, `private-checkbox` checked, and a `publish-state`
  saying it isn't published.
- Publishing with the box checked stores it private: `publish-state`
  reports published and private, `publish-button` and `private-checkbox`
  are gone, `unpublish-button` appears.
- The state survives a reload — it persisted, not just rendered.
- Unpublishing returns the step to its unpublished state, and that too
  survives a reload.
- Unchecking the box before publishing stores it public, and
  `publish-state` says so.
- On a grid-phase puzzle the publish step is `unavailable` and shows no
  `publish-button`.
- Publishing a puzzle with outstanding readiness findings still works —
  the panel reports them and the button publishes anyway.

## Definition of done

1. `npx vitest run src/lib/stepper.test.ts` passes.
2. `e2e/publish.spec.ts` passes.
3. Every other spec passes unmodified. **Check rather than assume** —
   `stepper.spec.ts` and `publish-readiness.spec.ts` both exercise the
   publish step and may be affected by it becoming reachable.
4. The migration applies cleanly to both local databases from a cold
   start.
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.
8. Opened as a PR, not merged.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
