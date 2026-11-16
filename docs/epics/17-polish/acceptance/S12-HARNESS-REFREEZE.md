# S12 harness correction approval and refreeze

On 2026-11-16, after requesting resumption using the handoff and resumption
instructions, the human explicitly approved the pending corrections: “I approve
the patch.” They also instructed that future approval requests explain the
necessary change and its reason directly, without asking them to read a patch
file. This approval applies to both exact corrections identified in those
instructions and independently reviewed in [resumption evidence](S12-S13-RESUMPTION.md).

The resuming orchestrator confirmed both SHA-256 hashes and clean apply checks
before applying the proposals without modification:

- [Live-sync correction](17-S12-live-sync-correction.patch):
  `b36bc674f927ff9d2ba7a6fba177fdc274ff66783687d1b70743b1d2a526a159`.
  Track requests originating in the idle measurement window, handle and drain
  response-body reads, and detach the listener before page teardown. Keep
  request-count, payload-size, timing and visibility assertions; require a
  nonempty body sample and propagate read failures.
- [Library isolation](17-S12-library-isolation-correction.patch):
  `f0bdcd5d028469d0b9355e68540c039e7a88324f56baf7cfd8fcca1be139b91b`.
  Use the existing fresh-user helper before each row-menu, puzzle-groups,
  small-screens and unlisted test. Keep all cases, fixtures, assertions and
  timeouts. No data deletion is introduced.

This specification/acceptance-only commit refreezes `e2e/live-sync.spec.ts`,
`e2e/row-menu.spec.ts`, `e2e/puzzle-groups.spec.ts`,
`e2e/small-screens.spec.ts` and `e2e/unlisted.spec.ts` on main. Runtime and
configuration edits remain outside it. The commit containing this record is
the corrected baseline; its hash will be recorded in the operational handoff.
Other frozen acceptance remains unchanged. Focused reliability, final verify
and the human-executed full browser gate remain required after refreeze.
