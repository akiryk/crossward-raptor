"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { flushSync } from "react-dom";
import type { Coord, Grid } from "../../engine/grid";
import { clearLetters, withLetter } from "../../engine/grid";
import type { CursorState } from "../../engine/cursor";
import {
  arrowKey,
  deleteAt,
  moveTo,
  place,
  toggleOrientation,
} from "../../engine/cursor";
import type { Phase } from "../../engine/puzzle";
import { intendedGeometry } from "../../engine/puzzle-geometry";
import { hintsComplete } from "../../engine/hints";
import {
  deserializeGrid,
  serializeGrid,
  type SerializedGrid,
} from "../../lib/puzzle-storage";
import { cellNumberKey } from "../../lib/cell-number-lookup";
import { buildSlotLookup, activeHintKey, isHintFilled } from "../../lib/hint-lookup";
import { adjacentHintKey, hintOrder } from "../../lib/hint-order";
import { keyToIntent } from "../../lib/keyboard-intent";
import { publishReadiness } from "../../lib/publish-readiness";
import { wordArrowKey, wordMoveTo, wordStart, wordToggle } from "../../lib/word-cursor";
import {
  saveGrid,
  saveHints,
  saveTitle,
  publishPuzzle,
  enterHints,
} from "../../app/puzzles/actions";
import type { Visibility } from "../../app/puzzles/actions";
import { PuzzleGrid } from "./PuzzleGrid";
import { HintsPanel } from "./HintsPanel";
import { HintBox } from "./HintBox";
import { HintSkeleton } from "./HintSkeleton";
import { PreviewLegend } from "./PreviewLegend";
import { PreviewToggle } from "./PreviewToggle";
import { EnterHintsDialog } from "./EnterHintsDialog";
import { BuilderSteps, PublishedState, ToggleRow, type BuilderStepId } from "./BuilderSteps";
import { TooEarlyDialog } from "./TooEarlyDialog";
import { PublishDialog } from "./PublishDialog";
import { PuzzleTitle } from "../puzzle/PuzzleTitle";
import { PlayerHints } from "../play/PlayerHints";
import { PlayHintBar } from "../play/PlayHintBar";
import { ProminentHint } from "../play/ProminentHint";
import { slotsWithNumbers } from "../../engine/numbering";

const SAVE_DEBOUNCE_MS = 500;
// Every grid size fits within this width at most (15-S1, 700px since 17-S7), whatever the
// window's height: a short window scrolls the page.
const GRID_MAX_PX = 700;

interface EditorState {
  grid: Grid;
  cursor: CursorState;
  phase: Phase;
  hints: Record<string, string>;
  title: string;
  publishedAt: Date | null;
  visibility: Visibility;
}

function firstActiveCell(grid: Grid): Coord {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === "active") {
        return { col, row };
      }
    }
  }
  throw new Error("firstActiveCell: grid has no active cells");
}

// The first white cell, Across; in the hints phase Down where it has no
// Across word, as play opens (17-S6).
function startCursor(grid: Grid, phase: Phase): CursorState {
  const current = firstActiveCell(grid);
  return phase === "hints" ? wordStart(grid, current) : { current, orientation: "across" };
}

export function PuzzleGridEditor({
  puzzleId,
  initialGrid,
  initialPhase,
  initialHints,
  initialTitle,
  initialPublishedAt,
  initialVisibility,
}: {
  puzzleId: string;
  initialGrid: SerializedGrid;
  initialPhase: Phase;
  initialHints: Record<string, string>;
  initialTitle: string;
  initialPublishedAt: Date | null;
  initialVisibility: Visibility;
}) {
  const [state, setState] = useState<EditorState>(() => {
    const grid = deserializeGrid(initialGrid);
    return {
      grid,
      cursor: startCursor(grid, initialPhase),
      phase: initialPhase,
      hints: initialHints,
      title: initialTitle,
      publishedAt: initialPublishedAt,
      visibility: initialVisibility,
    };
  });
  // What's already been persisted, so each autosave effect can tell a
  // genuine edit apart from React re-running it with the same value.
  // Seeded from the hook's own initial value (evaluated once, at the true
  // mount), not a boolean "have we run before" flag: in dev, React's
  // Strict Mode runs a fresh mount's effects twice (mount, simulated
  // unmount, mount again) to surface exactly this class of bug, and a
  // one-shot flag gets consumed by the first of those two passes, leaving
  // the second to wrongly treat the untouched initial value as a real
  // edit and schedule a save -- which a published puzzle's server-side
  // guard then rejects. Comparing against the last-saved value instead is
  // reentrant: replayed with the same value, it keeps skipping.
  const lastSavedGridRef = useRef(state.grid);
  const lastSavedHintsRef = useRef(state.hints);
  const lastSavedTitleRef = useRef(state.title);
  // Pending debounced-save timers, tracked so a publish click can cancel
  // whatever's pending and save the latest value immediately instead --
  // otherwise a save queued just before publishing loses the race against
  // publishPuzzle's now-published guard and is silently dropped (PB4
  // review finding).
  const gridSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Preview is component state, not persisted (Story D4) -- a reload
  // always returns to build view.
  const [isPreviewing, setIsPreviewing] = useState(false);
  // Preview turned on with the cursor on a cell it shows black: nothing is
  // selected, and keys do nothing, until a cell is clicked (17-S4).
  const [isPreviewCursorHidden, setIsPreviewCursorHidden] = useState(false);
  function changePreview(on: boolean) {
    if (on && !isPreviewing) {
      const { col, row } = state.cursor.current;
      setIsPreviewCursorHidden(intendedGeometry(state.grid).at(col, row).kind === "black");
    }
    setIsPreviewing(on);
  }
  // Lock Grid Letters (14-S12): the hints phase's guard against changing a
  // letter by accident. A way of working, like Preview, so not persisted.
  const [isLettersLocked, setIsLettersLocked] = useState(false);
  // Preview Hints (17-S9): the hints phase shows the player's view in
  // place. Selection works as in play; nothing can be typed. Not persisted.
  const [isHintsPreview, setIsHintsPreview] = useState(false);
  // Whether the grid (or something that logically belongs to it, like a
  // hint input -- see the onFocus/onBlur on editor-layout below) currently
  // holds keyboard focus. Drives both whether the cursor/slot highlight
  // renders and whether typed keys reach the grid at all: clicking a
  // button or the title moves real focus away, which should blur the grid
  // rather than leave it looking (and acting) selected forever.
  const [isFocused, setIsFocused] = useState(false);
  // Whether the grid itself has focus, rather than a hint input: in the
  // hints phase it decides between the cursor's yellow and the focused
  // hint's blue, and fills the cursor word's hint (14-S12).
  const [isGridFocused, setIsGridFocused] = useState(false);
  const gridRegionRef = useRef<HTMLDivElement>(null);
  // The Hint Box's word (15-S4): the cursor's, or the one it last showed
  // while the cursor's cell has no word in its direction.
  const [boxKey, setBoxKey] = useState<string | null>(null);
  const boxInputRef = useRef<HTMLTextAreaElement>(null);
  const [isEnterHintsDialogOpen, setIsEnterHintsDialogOpen] = useState(false);
  const [isNotQuiteOpen, setIsNotQuiteOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  // The hints 3 Publish found blank, each until its text next changes
  // (17-S1). Not persisted.
  const [missingKeys, setMissingKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (lastSavedGridRef.current === state.grid) return;
    lastSavedGridRef.current = state.grid;
    gridSaveTimer.current = setTimeout(() => {
      gridSaveTimer.current = null;
      saveGrid(puzzleId, serializeGrid(state.grid)).catch((error) => {
        console.error("Failed to save puzzle grid", error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (gridSaveTimer.current !== null) clearTimeout(gridSaveTimer.current);
    };
  }, [state.grid, puzzleId]);

  useEffect(() => {
    if (lastSavedHintsRef.current === state.hints) return;
    lastSavedHintsRef.current = state.hints;
    hintsSaveTimer.current = setTimeout(() => {
      hintsSaveTimer.current = null;
      saveHints(puzzleId, state.hints).catch((error) => {
        console.error("Failed to save puzzle hints", error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (hintsSaveTimer.current !== null) clearTimeout(hintsSaveTimer.current);
    };
  }, [state.hints, puzzleId]);

  useEffect(() => {
    if (lastSavedTitleRef.current === state.title) return;
    lastSavedTitleRef.current = state.title;
    titleSaveTimer.current = setTimeout(() => {
      titleSaveTimer.current = null;
      saveTitle(puzzleId, state.title).catch((error) => {
        console.error("Failed to save puzzle title", error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (titleSaveTimer.current !== null) clearTimeout(titleSaveTimer.current);
    };
  }, [state.title, puzzleId]);

  useEffect(() => {
    // Focusing the grid here (rather than leaving it unfocused until a
    // click) keeps the pre-existing "type immediately after load, no click
    // needed" behavior -- the effect that used to attach a global keydown
    // listener now establishes focus instead; onKeyDown below only ever
    // fires while the grid actually has it. isReady still flips exactly
    // when the grid can respond to input, so tests can wait for it rather
    // than racing hydration. In the hints phase nothing has focus on load
    // (14-S6, kept by 14-S12).
    // The focus doesn't scroll the page (15-S1): the grid can be taller
    // than the window allows.
    if (initialPhase === "grid") gridRegionRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [initialPhase]);

  function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const intent = keyToIntent(event.key);
    if (intent && isHintsPreview) {
      event.preventDefault();
      if (intent.type === "arrow") {
        setState((prev) => ({ ...prev, cursor: wordArrowKey(prev.grid, prev.cursor, intent.direction) }));
      } else if (intent.type === "toggleOrientation") {
        setState((prev) => ({ ...prev, cursor: wordToggle(prev.grid, prev.cursor) }));
      }
      return;
    }
    if (!intent || isLettersLocked) return;
    event.preventDefault();
    if (isPreviewing) {
      if (!isPreviewCursorHidden) setState((prev) => previewKey(prev, intent));
      return;
    }

    setState((prev) => {
      // Letters/deletion are the content a published puzzle freezes
      // (PB4); cursor movement is unaffected. Geometry is frozen by the
      // hints phase (Story E): the cursor only reaches on cells, so a
      // letter there overtypes and never changes the shape (14-S12).
      if (intent.type === "letter") {
        if (prev.publishedAt !== null) return prev;
        const { grid, cursor } = place(prev.grid, prev.cursor, intent.letter);
        return { ...prev, grid, cursor };
      }
      if (intent.type === "delete") {
        if (prev.publishedAt !== null) return prev;
        // Deletion stays blocked in the hints phase (Story H4): every
        // legal repair is an overtype once geometry is frozen, so a
        // cleared cell could only ever leave a hole.
        if (prev.phase === "hints") return prev;
        const { grid, cursor } = deleteAt(prev.grid, prev.cursor);
        return { ...prev, grid, cursor };
      }
      // The hints phase turns the cursor only onto a word (17-S6); the
      // build phase's words are still being made.
      if (intent.type === "arrow") {
        return {
          ...prev,
          cursor: prev.phase === "hints"
            ? wordArrowKey(prev.grid, prev.cursor, intent.direction)
            : arrowKey(prev.grid, prev.cursor, intent.direction),
        };
      }
      return {
        ...prev,
        cursor: prev.phase === "hints" ? wordToggle(prev.grid, prev.cursor) : toggleOrientation(prev.cursor),
      };
    });
  }

  // Preview's cursor moves over Preview's own words: the engine's cursor
  // functions over intendedGeometry, letters placed in the real grid (17-S4).
  function previewKey(prev: EditorState, intent: NonNullable<ReturnType<typeof keyToIntent>>): EditorState {
    const shown = intendedGeometry(prev.grid);
    if (intent.type === "letter") {
      if (prev.publishedAt !== null) return prev;
      const grid = place(prev.grid, prev.cursor, intent.letter).grid;
      const { cursor } = place(intendedGeometry(grid), prev.cursor, intent.letter);
      return { ...prev, grid, cursor };
    }
    if (intent.type === "delete") {
      if (prev.publishedAt !== null) return prev;
      const deleted = deleteAt(shown, prev.cursor);
      if (deleted.grid === shown) return prev;
      return {
        ...prev,
        grid: withLetter(prev.grid, deleted.cursor.current, null),
        cursor: deleted.cursor,
      };
    }
    if (intent.type === "arrow") {
      return { ...prev, cursor: arrowKey(shown, prev.cursor, intent.direction) };
    }
    return { ...prev, cursor: toggleOrientation(prev.cursor) };
  }

  function handleCellClick(coord: Coord) {
    // Preview Hints selects as play does, whatever Lock Grid Letters says (17-S9).
    if (isHintsPreview) {
      if (state.grid.at(coord.col, coord.row).kind !== "active") return;
      gridRegionRef.current?.focus();
      setState((prev) => ({ ...prev, cursor: wordMoveTo(prev.grid, prev.cursor, coord) }));
      return;
    }
    // A published puzzle's grid, or one with its letters locked, takes no
    // focus, and a click selects nothing (14-S12).
    if (state.publishedAt !== null || isLettersLocked) return;
    if (isPreviewing) {
      if (intendedGeometry(state.grid).at(coord.col, coord.row).kind === "black") return;
      gridRegionRef.current?.focus();
      setIsPreviewCursorHidden(false);
      setState((prev) => ({
        ...prev,
        cursor: moveTo(intendedGeometry(prev.grid), prev.cursor, coord),
      }));
      return;
    }
    // A plain click on a non-focusable cell doesn't move DOM focus to its
    // focusable ancestor by itself -- without this, clicking a cell after
    // focus had moved elsewhere (a button, the title) would update the
    // cursor but leave the grid still visually and functionally blurred.
    gridRegionRef.current?.focus();
    setState((prev) => ({
      ...prev,
      cursor: prev.phase === "hints"
        ? wordMoveTo(prev.grid, prev.cursor, coord)
        : moveTo(prev.grid, prev.cursor, coord),
    }));
  }

  // Cancels any pending debounced saves and re-issues them immediately
  // with the current in-memory values, so an edit made just before
  // publishing is persisted before publishPuzzle's guard would otherwise
  // reject it.
  function flushPendingSaves(): Promise<unknown> {
    if (gridSaveTimer.current !== null) {
      clearTimeout(gridSaveTimer.current);
      gridSaveTimer.current = null;
    }
    if (hintsSaveTimer.current !== null) {
      clearTimeout(hintsSaveTimer.current);
      hintsSaveTimer.current = null;
    }
    if (titleSaveTimer.current !== null) {
      clearTimeout(titleSaveTimer.current);
      titleSaveTimer.current = null;
    }
    return Promise.all([
      saveGrid(puzzleId, serializeGrid(state.grid)),
      saveHints(puzzleId, state.hints),
      saveTitle(puzzleId, state.title),
    ]);
  }

  // The one step button: 2 Create Hints in the build phase, 3 Publish in
  // the hints phase (17-S8).
  function handleStep(id: Exclude<BuilderStepId, "build">) {
    if (id === "publish") {
      if (!hintsComplete(state)) {
        setMissingKeys(
          new Set(
            Array.from(buildSlotLookup(state.grid).keys()).filter(
              (key) => !isHintFilled(state.hints, key),
            ),
          ),
        );
        // The marks show only in the editing view.
        setIsHintsPreview(false);
        setIsNotQuiteOpen(true);
      } else {
        setIsPublishDialogOpen(true);
      }
      return;
    }
    // Preview turns on as the dialog opens and stays on unless the
    // builder confirms (14-S10).
    changePreview(true);
    setIsEnterHintsDialogOpen(true);
  }

  function handleCancelEnterHints() {
    setIsEnterHintsDialogOpen(false);
  }

  function handleConfirmEnterHints() {
    setIsEnterHintsDialogOpen(false);
    // The hints phase has no Preview, so its grid starts in its own look.
    changePreview(false);
    // enterHints reloads the puzzle from the database, so a letter typed
    // within the last debounce window has to be flushed first or the
    // conversion would read that cell as empty and blacken it.
    flushPendingSaves()
      .then(() => enterHints(puzzleId))
      .then(({ phase, hints, grid }) => {
        // The cursor starts over by the hints phase's rule: the conversion
        // may have turned its cell black (17-S6).
        setState((prev) => {
          const next = deserializeGrid(grid);
          return { ...prev, phase, hints, grid: next, cursor: startCursor(next, phase) };
        });
      })
      .catch((error) => {
        console.error("Failed to enter hints phase", error);
      });
  }

  // The Publish dialog shows its own failure line, so a rejection is
  // passed back to it.
  function handlePublish(visibility: Visibility): Promise<void> {
    return flushPendingSaves()
      .then(() => publishPuzzle(puzzleId, visibility))
      .then(({ publishedAt, visibility }) => {
        setIsPublishDialogOpen(false);
        setState((prev) => ({ ...prev, publishedAt, visibility }));
      });
  }

  function handleTitleChange(title: string) {
    setState((prev) => ({ ...prev, title }));
  }

  function handleHintChange(key: string, text: string) {
    setState((prev) => ({ ...prev, hints: { ...prev.hints, [key]: text } }));
    setMissingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleHintFocus(key: string) {
    setState((prev) => {
      const slot = buildSlotLookup(prev.grid).get(key);
      return slot
        ? {
            ...prev,
            cursor: { current: slot.start, orientation: slot.orientation },
          }
        : prev;
    });
  }

  const {
    grid,
    cursor,
    phase,
    hints,
    title,
    publishedAt,
  } = state;
  const isPublished = publishedAt !== null;
  const slotLookup = buildSlotLookup(grid);
  const activeKey = activeHintKey(slotLookup, cursor);
  if (activeKey !== null && activeKey !== boxKey) setBoxKey(activeKey);
  const shownKey = activeKey ?? boxKey ?? hintOrder(slotLookup)[0] ?? null;
  const shownSlot = shownKey === null ? undefined : slotLookup.get(shownKey);

  // Preview Hints' selection, as play's (17-S9): a hint selects its word
  // from its first cell, every cell being empty in the player's view.
  const hintsPreviewKey = isHintsPreview && isFocused ? activeKey : null;
  const hintsPreviewSlot = hintsPreviewKey === null ? undefined : slotLookup.get(hintsPreviewKey);
  function handlePreviewHint(key: string) {
    const slot = slotLookup.get(key);
    if (!slot) return;
    gridRegionRef.current?.focus();
    setState((prev) => ({ ...prev, cursor: { current: slot.start, orientation: slot.orientation } }));
  }
  function handlePreviewStep(step: 1 | -1) {
    const key = activeKey ? adjacentHintKey(slotLookup, activeKey, step) : hintOrder(slotLookup).at(step === 1 ? 0 : -1);
    if (key) handlePreviewHint(key);
  }

  // An arrow selects its word: the cursor moves there first, so the box's
  // input is already that word's when it takes focus (15-S4). Published,
  // the input is disabled and focus stays on the arrow.
  function handleBoxStep(step: 1 | -1) {
    const key = shownKey === null ? null : adjacentHintKey(slotLookup, shownKey, step);
    if (key === null) return;
    flushSync(() => handleHintFocus(key));
    boxInputRef.current?.focus();
  }

  // No highlight at all once focus has moved somewhere that isn't the grid
  // or a hint input (a button, the title) -- otherwise the cursor cell
  // would read as selected forever, regardless of what actually has focus.
  const highlights = new Map<string, "selected" | "slot">();
  const highlightLookup = isPreviewing ? buildSlotLookup(intendedGeometry(grid)) : slotLookup;
  const highlightKey = isPreviewing ? activeHintKey(highlightLookup, cursor) : activeKey;
  if (isFocused && !(isPreviewing && isPreviewCursorHidden)) {
    if (highlightKey) {
      const activeSlot = highlightLookup.get(highlightKey)!;
      for (const cell of activeSlot.cells) {
        highlights.set(cellNumberKey(cell), "slot");
      }
    }
    highlights.set(cellNumberKey(cursor.current), "selected");
  }

  // React's onFocus/onBlur bubble (unlike native focus/blur), so this one
  // pair on the shared ancestor of the grid and the hint inputs tracks
  // "focus is somewhere that should keep the grid looking selected."
  // Moving focus from the grid to a hint input fires blur-then-focus here
  // in the same tick, which React batches into one update -- isFocused
  // never visibly flips false in between.
  function handleEditorFocus() {
    setIsFocused(true);
  }
  function handleEditorBlur() {
    setIsFocused(false);
  }

  return (
    // Below 1092px of room, a 1140px window (17-S7), the builder is one column at
    // the grid's width, centered (15-S3).
    <div
      data-testid="puzzle-editor"
      data-ready={isReady}
      className="@container/editor m-auto"
    >
      <div className="mx-auto max-w-[700px] @min-[1092px]/editor:max-w-none">
        <PuzzleTitle
          value={title}
          onChange={handleTitleChange}
          disabled={isPublished}
        />
        {/* The step row, then the toggle row, 20px apart and 20px above the
            grid; in one column, 16px (17-S8). */}
        <div className="mb-4 flex flex-col gap-4 @min-[1092px]/editor:mb-5 @min-[1092px]/editor:gap-5">
          {isPublished ? (
            // Wide, as tall as the step row, so the grid doesn't move.
            <div className="@min-[1092px]/editor:min-h-8">
              <PublishedState puzzleId={puzzleId} />
            </div>
          ) : (
            <BuilderSteps phase={phase} onStep={handleStep} />
          )}
          <div className={`${isPublished ? "hidden" : "flex"} @min-[1092px]/editor:flex @min-[1092px]/editor:gap-8`}>
            <ToggleRow isPublished={isPublished}>
              {phase === "grid" && (
                <PreviewToggle
                  isPreviewing={isPreviewing}
                  onToggle={() => changePreview(!isPreviewing)}
                />
              )}
              {phase === "hints" && !isPublished && (
                <div className="flex items-center gap-3 min-[748px]:gap-5">
                  <PreviewToggle
                    data-testid="lock-letters-toggle"
                    label="Lock Grid Letters"
                    isPreviewing={isLettersLocked}
                    disabled={isHintsPreview}
                    onToggle={() => setIsLettersLocked((prev) => !prev)}
                  />
                  {/* Narrow, Preview Hints follows Lock Grid Letters (17-S9). */}
                  <div className="flex @min-[1092px]/editor:hidden">
                    <PreviewToggle
                      data-testid="preview-hints-toggle"
                      label="Preview Hints"
                      isPreviewing={isHintsPreview}
                      onToggle={() => setIsHintsPreview((prev) => !prev)}
                    />
                  </div>
                </div>
              )}
            </ToggleRow>
            {/* Wide, Preview Hints has its own panel over the hints list,
                on the toggle row's line (17-S9). */}
            {phase === "hints" && (
              <div
                data-testid="preview-hints-row"
                className={`hidden h-12 min-w-0 flex-1 items-center rounded-modal px-4 @min-[1092px]/editor:flex ${
                  isPublished ? "invisible" : "bg-toggle-row"
                }`}
              >
                {!isPublished && (
                  <PreviewToggle
                    data-testid="preview-hints-toggle"
                    label="Preview Hints"
                    isPreviewing={isHintsPreview}
                    onToggle={() => setIsHintsPreview((prev) => !prev)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <EnterHintsDialog
          open={isEnterHintsDialogOpen}
          onConfirm={handleConfirmEnterHints}
          onCancel={handleCancelEnterHints}
        />
        <TooEarlyDialog open={isNotQuiteOpen} onClose={() => setIsNotQuiteOpen(false)} />
        {isPublishDialogOpen && (
          <PublishDialog
            findings={publishReadiness({ grid, hints, phase })}
            onPublish={handlePublish}
            onCancel={() => setIsPublishDialogOpen(false)}
          />
        )}
        {/* Preview Hints: play's Prominent Hint over the grid, 16px above
            it, wide only (17-S9). */}
        {isHintsPreview && (
          <div className="mb-4 hidden w-[700px] max-w-full @min-[1092px]/editor:block">
            <ProminentHint
              label={hintsPreviewSlot ? `${hintsPreviewSlot.number}${hintsPreviewSlot.orientation === "across" ? "A" : "D"}` : null}
              hint={hintsPreviewKey ? hints[hintsPreviewKey] ?? "" : ""}
            />
          </div>
        )}
        <div
          data-testid="editor-layout"
          className="flex flex-col gap-6 @min-[1092px]/editor:flex-row @min-[1092px]/editor:items-start @min-[1092px]/editor:gap-8"
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
        >
          <div
            className="max-w-full shrink-0"
            style={{ width: `${GRID_MAX_PX}px` }}
          >
            <div
              ref={gridRegionRef}
              data-testid="grid-region"
              // A published puzzle's grid, or one with its letters locked,
              // takes no focus: no Tab stop, no click focus, no keys (14-S12).
              tabIndex={isPublished || (isLettersLocked && !isHintsPreview) ? undefined : 0}
              onKeyDown={handleGridKeyDown}
              onFocus={() => setIsGridFocused(true)}
              onBlur={() => setIsGridFocused(false)}
              className="w-full outline-none"
            >
              {isHintsPreview ? (
                <PuzzleGrid
                  grid={clearLetters(grid)}
                  mode="play"
                  highlights={highlights}
                  onCellClick={handleCellClick}
                />
              ) : (
                <PuzzleGrid
                  grid={grid}
                  highlights={highlights}
                  mode={isPreviewing ? "preview" : "build"}
                  isHintsPhase={phase === "hints"}
                  isGridFocused={isGridFocused}
                  isLettersLocked={phase === "hints" && isLettersLocked}
                  onCellClick={handleCellClick}
                />
              )}
            </div>
            {isHintsPreview && (
              <div className="@min-[1092px]/editor:hidden">
                <PlayHintBar hint={hintsPreviewKey ? hints[hintsPreviewKey] ?? "" : ""} onStep={handlePreviewStep} />
              </div>
            )}
            {phase === "grid" && isPreviewing && <PreviewLegend grid={grid} />}
            {/* Below 1092px of room the Hint Box takes the list's place,
                directly under the grid (15-S4). */}
            {phase === "hints" && !isHintsPreview && shownKey !== null && shownSlot && (
              <div className="@min-[1092px]/editor:hidden">
                <HintBox
                  grid={grid}
                  slot={shownSlot}
                  hint={hints[shownKey] ?? ""}
                  isMissing={missingKeys.has(shownKey)}
                  disabled={isPublished}
                  inputRef={boxInputRef}
                  onHintChange={(text) => handleHintChange(shownKey, text)}
                  onHintFocus={() => handleHintFocus(shownKey)}
                  onStep={handleBoxStep}
                />
              </div>
            )}
          </div>
          {phase === "grid" && <HintSkeleton grid={grid} />}
          {phase === "hints" && (
            // Beside the grid, the list scrolls in its own box at the grid's
            // height (15-S1): size containment keeps its content from
            // stretching the row, so the grid sets the row's height. Narrow,
            // the Hint Box shows instead (15-S4).
            <div
              data-testid="hints-region"
              className="hidden min-w-0 flex-1 overflow-y-auto @min-[1092px]/editor:block @min-[1092px]/editor:self-stretch @min-[1092px]/editor:[contain:size]"
            >
              {isHintsPreview ? (
                <PlayerHints
                  slots={slotsWithNumbers(grid)}
                  hints={hints}
                  selectedKey={hintsPreviewKey}
                  onSelect={handlePreviewHint}
                />
              ) : (
                <HintsPanel
                  grid={grid}
                  slots={slotLookup}
                  hints={hints}
                  activeKey={activeKey}
                  disabled={isPublished}
                  selectedKey={isGridFocused ? activeKey : null}
                  missingKeys={missingKeys}
                  onHintChange={handleHintChange}
                  onHintFocus={handleHintFocus}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
