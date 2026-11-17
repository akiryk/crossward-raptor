# S12 then S13 — approved acceptance packet

**Human approved 2026-11-15:** “I approve S12 and S13”. This response
covers both specifications, new executable acceptance and exact supersessions.
The approved proposal hashes matched [draft evidence](EVIDENCE.md) before
application. Both patches were applied unchanged, S12 then S13, in separate
specification-only commits on `main`. The human separately authorized S12 runtime
implementation on 2026-11-15, then authorized resuming S12 and implementing
S13 on 2026-11-16. Both implementations now pass final verify and the human-run
full browser gate; [resumption evidence](S12-S13-RESUMPTION.md) records current
checks and delivery/closeout state. [Runtime evidence](S12-RUNTIME-EVIDENCE.md)
retains earlier S12 checks and independent review. On 2026-11-15 the human approved the expanded
[correction patch](17-S12-correction.patch), applied in a separate specification-only
main commit before refreeze. It changes the two S12 hints-selection branches and
the wide narrow-play idle hook expectation. The human subsequently approved the
independently reviewed [DONE-icon settling correction](17-S12-done-icon-correction.patch),
refrozen separately in specification-only commit `b2d8ea1`. It waits for the
existing final row color before the reset icon screenshot; pixel assertions and
tolerances are unchanged. S13 acceptance remains unchanged. The human also
approved both exact harness corrections on 2026-11-16, separately refrozen in
`65c92af`; see the [approval record](S12-HARNESS-REFREEZE.md).

| Story | Specification | Frozen executable acceptance | Applied exact amendment |
| --- | --- | --- | --- |
| S12 | [Quiet saved state](../stories/17-S12-quiet-saved-state.md) | [23 browser cases](../../../../e2e/quiet-saved-state.spec.ts) | [S12 patch](17-S12-supersession.patch), 26 existing cases in seven files |
| S13 | [Prominent Hint polish](../stories/17-S13-prominent-hint-polish.md) | [8 browser cases](../../../../e2e/prominent-hint-polish.spec.ts) | [S13 patch](17-S13-supersession.patch), 16 cases and five map-driven cases in six files |

The [case inventory](CASES.md) names every amended case. Patches are retained
verbatim as approval records; do not apply them again. S12 was based on
`61bb72a`; S13 applies to S12's amended acceptance. See the
[handoff](../HANDOFF.md) for baseline commits and current verification.
[EVIDENCE.md](EVIDENCE.md) preserves earlier independent specification reviews
and expected pre-implementation failures as historical evidence.

The approved product details include:

- **S12:** silent successful state and zero idle-status footprint in builder/play,
  including before the first edit; empty acknowledgment hooks; retained real
  persistence, transient saving and failure/retry feedback. Healthy unfinished
  wide play has 32px title-to-hint and 16px hint-to-grid spacing. Preserve builder
  permissions, controls and the right-aligned collaboration link.
- **S13:** faint `#F1F8FC` for absent/blank/whitespace-only hint text using
  `prominent-hint-empty → interactive-faint`; populated hints retain blue-medium.
  Remove the standalone number/direction and space, preserve authored text and
  numbering elsewhere, and add an empty style-guide sample. Selection, linking,
  narrow play and frame geometry remain unchanged.

Both baselines intentionally precede runtime changes. Earlier S12-only
verification used its own frozen tree while S13 runtime remained unauthorized.
Both runtimes are now authorized and verified together on main, preserving
all frozen cases outside the separately approved exact amendments. The current
[handoff](../HANDOFF.md) records delivery and independent closeout state.
