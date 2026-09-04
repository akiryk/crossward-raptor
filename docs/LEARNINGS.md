# Learnings

Process knowledge from work already done on this repo. Not conventions
(`AGENTS.md`) and not decisions (the story docs' own Decisions sections) —
this is about *how the work went wrong and got recovered*, so the same
mistakes cost less next time.

Each entry names the incident that produced it. The incidents are the
point: a rule with no evidence behind it reads as generic advice and gets
skipped. Prune this file like code — an entry that stops earning its place
should go.

---

## 1. On intermittent bugs, measure before theorizing

Two plausible hypotheses about the same flaky-test symptom were proposed
and both were wrong:

- **"The keydown listener attaches too late"** → fixed by switching
  `useEffect` to `useLayoutEffect`. Made no difference: 4 of 5 runs still
  failed. `useLayoutEffect` only changes timing *after* React mounts; it
  can't close a gap that opens before mounting starts.
- **"The database round-trip is occasionally slow under load"** → fixed by
  raising an assertion timeout to 15s. Made no difference: the assertion
  burned the full 15 seconds and the value never changed. The write wasn't
  slow, it was never landing.

What actually worked both times was instrumentation — logging the real
sequence of events. The first case took one diagnostic run to find
(`pressed ArrowDown` logged *before* `keydown-effect attach`, proving the
event had nowhere to land). The second took one experiment that doubled as
the fix (waiting on the real Server Action response instead of a guessed
duration).

**Rule:** when behavior is *intermittent*, go to measurement before the
second hypothesis, not after the third. Code inspection is weakest exactly
where timing is involved, and a diagnostic run is usually cheaper than the
guess that precedes it.

## 2. "Passed once" is not evidence

Every real fix in this repo was confirmed by repetition, not by a single
green run: 15 repeated runs of the specific previously-failing test for the
hydration fix, 5 consecutive full-suite runs for the reload race. In both
cases the suite had *also* passed occasionally while still broken — 1 of 5
runs was clean during the worst of the flakiness.

**Rule:** for anything intermittent, the bar is repeated runs of the
specific test that was failing, not one pass of the suite. State the
repetition count when reporting a fix.

## 3. Verify repo state before writing a spec against it

Story docs written from assumption rather than inspection were wrong three
times:

- `toggleBlackSymmetric` was specified as living in `grid.ts`; it actually
  lives in `symmetry.ts`. Caught before implementation.
- A story's Definition of Done referenced "existing Group A tests" in a
  file that didn't have them. Caught by the implementing agent, which
  correctly stopped rather than guessing which of two readings was meant.
- Story P3's scope note said `PuzzleGrid.tsx` wouldn't need changes. It
  did — the result was an orphaned component and a duplicated grid-layout
  container that Story P5 had to reconcile.

The third one is the instructive case: it wasn't caught, because nobody
checked. The cost was a full story's worth of cleanup later.

**Rule:** read the actual file before specifying against it. If a spec is
being written without seeing the code it touches, say so explicitly in the
spec (as an assumption to verify) rather than leaving it implicit.

## 4. "It's only a test problem" deserves scrutiny

Twice, a symptom dismissed as test-harness noise turned out to have a real
production analogue:

- The hydration race meant a real user typing immediately on page load
  could silently lose that keystroke.
- The reload race meant a user navigating away within a few hundred
  milliseconds of an action could silently lose the write.

Neither was catastrophic, and one was ultimately accepted as a known
limitation rather than fixed. But both were misdiagnosed as "tests only"
before investigation showed otherwise.

**Rule:** before accepting a test-only diagnosis, ask what the equivalent
user behavior would be. If a person could plausibly do what the test does,
it isn't test-only.

## 5. Stop and report rather than shipping an unverified fix

The two disproven hypotheses in entry 1 were both caught because the
implementing agent ran the verification, saw it didn't work, and reported
that instead of committing the change anyway. Both times it explicitly
declined to push a no-op under a commit message claiming a fix.

**Rule:** a change that doesn't verifiably do what it was meant to do
doesn't get committed, even when it was explicitly requested. Report the
negative result — that's the useful output.
