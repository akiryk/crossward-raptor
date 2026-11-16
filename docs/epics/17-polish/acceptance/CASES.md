# Approved supersession case inventory

Human approved 2026-11-15 (“I approve S12 and S13”); applied unchanged in separate S12 then S13 specification-only freezes. Paths/line numbers refer to the source for each patch: current `61bb72a` for S12, then the S12 result for S13. The patches are the exact replacements; this index identifies every affected case. Shared map additions are listed separately below.

## S12

| File | Existing case changed |
| --- | --- |
| `e2e/editor-operations.spec.ts:49` | 24-S3-E1 saving status and bursts / a word typed is one operation; the status goes Saving… then Saved; the same letter again is no change |
| `e2e/editor-operations.spec.ts:68` | 24-S3-E1 saving status and bursts / moving to another word finalizes the burst; a long run of typing is cut at the maximum wait |
| `e2e/editor-operations.spec.ts:87` | 24-S3-E1 saving status and bursts / a title and a hint are their own bursts, finalized on blur |
| `e2e/editor-operations.spec.ts:105` | 24-S3-E2 failures, the journal and leaving / a failing send shows Not saved — retrying, then saves once it can |
| `e2e/editor-operations.spec.ts:119` | 24-S3-E2 failures, the journal and leaving / reloading with journaled operations warns, then restores and saves them |
| `e2e/editor-operations.spec.ts:148` | 24-S3-E2 failures, the journal and leaving / an operation that landed without its answer is re-sent after a reload and applied once |
| `e2e/editor-operations.spec.ts:257` | 24-S3-E5 old tabs and removed snapshot actions / a version-0 puzzle edited by the editor refuses snapshot writes: an old tab’s save changes nothing |
| `e2e/live-sync.spec.ts:59` | 24-S4-E1 two contexts of one account converge / each sees the other’s words; overlapping edits end as the later commit; compatible ones both survive; nothing local moves |
| `e2e/live-sync.spec.ts:100` | 24-S4-E1 two contexts of one account converge / remote changes keep the builder’s unsaved edits shown, its cursor and its focus |
| `e2e/live-sync.spec.ts:124` | 24-S4-E2 a Start Over or Enter Hints from another context / Start Over elsewhere clears this editor; its edit made before it heard is refused, its input kept |
| `e2e/live-sync.spec.ts:162` | 24-S4-E2 a Start Over or Enter Hints from another context / Enter Hints elsewhere moves this editor to Create Hints, Preview off; its hints then save |
| `e2e/live-sync.spec.ts:198` | 24-S4-E3 reconnecting / a context taken offline edits, the other edits meanwhile; back online, both converge |
| `e2e/live-sync.spec.ts:226` | 24-S4-E3 reconnecting / behind the log’s retention, the editor reloads the puzzle as stored and carries on |
| `e2e/live-sync.spec.ts:245` | 24-S4-E3 reconnecting / a tab that adopts a live tab’s journal: the edit is committed once, both tabs show it, both journals empty |
| `e2e/collaborators.spec.ts:89` | 24-S5-E1 a collaborator edits the shared puzzle / Jay and Adam each see the other’s words; only Adam has Reset Grid |
| `e2e/collaborators.spec.ts:112` | 24-S5-E1 a collaborator edits the shared puzzle / in Create Hints Jay’s hints save and he has no 3 Publish; Adam has it |
| `e2e/conflicts.spec.ts:61` | 24-S7 conflicts / 24-S7-E6 MAGIC wins: Adam’s 2-Down is outlined and noted, his cursor and focus untouched |
| `e2e/conflicts.spec.ts:105` | 24-S7 conflicts / 24-S7-E7 MAGKS: Jay types only MAG |
| `e2e/conflicts.spec.ts:121` | 24-S7 conflicts / 24-S7-E8 unrelated edits both persist, with no outline and no note |
| `e2e/conflicts.spec.ts:146` | 24-S7 conflicts / 24-S7-E9 reconnecting: Jay comes back online with no false conflict |
| `e2e/conflicts.spec.ts:171` | 24-S7 conflicts / 24-S7-E10 a hint: Jay replaces the one Adam is writing; it is highlighted and noted |
| `e2e/collaborator-management.spec.ts:207` | 24-S6-E4 removal in the dialog while Jay edits / Jay’s editor explains, becomes read-only, and the puzzle leaves his library |
| `e2e/play-design.spec.ts:322` | 14-S7-4 title, controls and status / the title is title-1 primary, 32px above the controls row |
| `e2e/play-design.spec.ts:334` | 14-S7-4 title, controls and status / the save status is body-small, muted, on the controls row at its right |
| `e2e/completed-play.spec.ts:184` | 19-S1-3 Reset plays the puzzle again / confirming starts a blank attempt at 1 Across, which plays and completes again |
| `e2e/completed-play.spec.ts:261` | 19-S1-4 an unfinished puzzle is unchanged (guards) / `at ${viewport.width}px: no Reset; the Rebus control stays` |

### Approved S12 correction (2026-11-15)

The separately approved [expanded correction](17-S12-correction.patch) preserves
all case counts and assertions except the explicitly superseded idle visibility
expectation. It corrects these cases:

| File | Case / correction |
| --- | --- |
| `e2e/quiet-saved-state.spec.ts` | 17-S12-1 hints, owner and collaborator at 1440px and 390px: explicitly select Across in the edit and reload branches before checking the persisted Across hint |
| `e2e/narrow-play.spec.ts:149` | 15-S5-1 at 1430px: idle save hook acknowledged, empty and hidden; all other wide visibility checks retained |

The narrow-play case is the 27th existing-case S12 supersession; the original
26-case patch above remains unchanged. S13 acceptance below is unchanged.

### Approved DONE-icon settling correction (2026-11-15)

The human approved the independently reviewed
[exact correction](17-S12-done-icon-correction.patch) for
`e2e/done-icon.spec.ts`, **18-S5-5**, “after Reset the row draws Play and reads
"Ready to play"”. It polls for the final `PLAY_ROW` background before the icon
screenshot, preserving every pixel assertion and tolerance. This is a separate
pre-existing test race correction, not a product-behavior supersession. Frozen
S13 acceptance is unchanged.

## S13

| File | Existing case changed |
| --- | --- |
| `e2e/play-design.spec.ts:161` | 14-S7-2 the Prominent Hint / a bar the grid’s width, 16px above it, blue-medium, 10px corners, 52px tall, showing 1A on open |
| `e2e/play-design.spec.ts:175` | 14-S7-2 the Prominent Hint / shows the selected word's number and direction in title-4 and its hint in title-3, on one baseline |
| `e2e/play-design.spec.ts:187` | 14-S7-2 the Prominent Hint / follows the cursor’s word |
| `e2e/play-design.spec.ts:198` | 14-S7-2 the Prominent Hint / empties, keeping its height, when the grid loses focus |
| `e2e/play-design.spec.ts:273` | 14-S7-3 Player Hints / a click on a hint selects its word at its first empty cell, and typing fills it |
| `e2e/play-design.spec.ts:294` | 14-S7-3 Player Hints / a click on a full word’s hint selects its first cell |
| `e2e/play-design.spec.ts:375` | 14-S7-5 style guide / sg-grid-play shows the play colors, a Prominent Hint and a selected Player Hint |
| `e2e/play-opening.spec.ts:101` | 17-S2-1 play opens on the first empty cell / a new session: (0,0) Across, the grid focused, the Prominent Hint showing, typing at once |
| `e2e/play-opening.spec.ts:112` | 17-S2-1 play opens on the first empty cell / a saved session opens on its first empty cell in reading order, and so does a reload |
| `e2e/play-opening.spec.ts:128` | 17-S2-1 play opens on the first empty cell / a cell with no Across word opens Down |
| `e2e/play-opening.spec.ts:135` | 17-S2-1 play opens on the first empty cell / a full but unsolved grid opens on its first white cell |
| `e2e/play-opening.spec.ts:143` | 17-S2-1 play opens on the first empty cell / clicking the opening cell toggles to Down, as any cursor cell |
| `e2e/play-opening.spec.ts:196` | 17-S2-2 the Prominent Hint’s text / title-3 primary, on the label’s baseline, in a 52px bar |
| `e2e/completed-play.spec.ts:184` | 19-S1-3 Reset plays the puzzle again / confirming starts a blank attempt at 1 Across, which plays and completes again |
| `e2e/real-words.spec.ts:177` | 17-S6 play selects only real words / 17-S6-7 the opening cell, Down only, ignores a second click, Space and cross-axis arrows |
| `e2e/real-words.spec.ts:184` | 17-S6 play selects only real words / 17-S6-8 a click on an Across-only cell while Down takes Across, and stays there |

S13 also extends the shared `STYLES` maps in `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts` with exactly `prominent-hint-empty → interactive-faint`. This extends these existing cases (no palette value changes):

- `src/app/globals-css.test.ts`: declares each style in @theme as a reference to its variable.
- `src/app/globals-css.test.ts`: has no @theme colors besides the new styles.
- `e2e/color-tokens.spec.ts`: every style resolves to its variable app-wide.
- `e2e/color-tokens.spec.ts`: each style follows its variable when the variable is edited live.
- `e2e/color-tokens.spec.ts`: every style is shown with its variable, swatched in its color.
