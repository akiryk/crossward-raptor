"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Coord, Grid } from "../../engine/grid";
import type { CursorState } from "../../engine/cursor";
import {
  arrowKey,
  deleteAt,
  moveTo,
  place,
  toggleOrientation,
} from "../../engine/cursor";
import type { Phase } from "../../engine/puzzle";
import { applyGeometryEdit } from "../../engine/phase";
import { hintsComplete } from "../../engine/hints";
import {
  deserializeGrid,
  serializeGrid,
  type SerializedGrid,
} from "../../lib/puzzle-storage";
import { cellNumberKey } from "../../lib/cell-number-lookup";
import { buildSlotLookup, activeHintKey } from "../../lib/hint-lookup";
import { keyToIntent } from "../../lib/keyboard-intent";
import { publishReadiness } from "../../lib/publish-readiness";
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
import { PreviewToggle } from "./PreviewToggle";
import { EnterHintsDialog } from "./EnterHintsDialog";
import { BuilderSteps, PublishedState, type BuilderStepId } from "./BuilderSteps";
import { TooEarlyDialog, type TooEarlyKind } from "./TooEarlyDialog";
import { PublishDialog } from "./PublishDialog";
import { PuzzleTitle } from "../puzzle/PuzzleTitle";

const SAVE_DEBOUNCE_MS = 500;
const LOCKED_MESSAGE_MS = 2000;
// Space reserved above editor-layout for the title, phase line, and
// editor-actions row (now including the stepper, Story D5b), so the
// height-based term of the grid's min() sizing (Story D5a) doesn't push
// its bottom edge past the viewport.
const VERTICAL_ALLOWANCE_PX = 300;

interface EditorState {
  grid: Grid;
  cursor: CursorState;
  phase: Phase;
  hints: Record<string, string>;
  title: string;
  geometryLocked: boolean;
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
      cursor: { current: firstActiveCell(grid), orientation: "across" },
      phase: initialPhase,
      hints: initialHints,
      title: initialTitle,
      geometryLocked: false,
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
  // Same reasoning as preview (D4): a way of looking at the puzzle, not a
  // property of it. Not persisted -- a reload returns to the locked grid.
  const [isEditingGrid, setIsEditingGrid] = useState(false);
  // Whether the grid (or something that logically belongs to it, like a
  // hint input -- see the onFocus/onBlur on editor-layout below) currently
  // holds keyboard focus. Drives both whether the cursor/slot highlight
  // renders and whether typed keys reach the grid at all: clicking a
  // button or the title moves real focus away, which should blur the grid
  // rather than leave it looking (and acting) selected forever.
  const [isFocused, setIsFocused] = useState(false);
  const gridRegionRef = useRef<HTMLDivElement>(null);
  const [isEnterHintsDialogOpen, setIsEnterHintsDialogOpen] = useState(false);
  const [tooEarly, setTooEarly] = useState<TooEarlyKind | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  // Build-phase clicks on 3 Publish since the page loaded: the first says
  // "Lol.", every later one "Nope." (14-S4). Not persisted.
  const buildPublishClicks = useRef(0);

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
    if (!state.geometryLocked) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, geometryLocked: false }));
    }, LOCKED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [state.geometryLocked]);

  useEffect(() => {
    // Focusing the grid here (rather than leaving it unfocused until a
    // click) keeps the pre-existing "type immediately after load, no click
    // needed" behavior -- the effect that used to attach a global keydown
    // listener now establishes focus instead; onKeyDown below only ever
    // fires while the grid actually has it. isReady still flips exactly
    // when the grid can respond to input, so tests can wait for it rather
    // than racing hydration.
    gridRegionRef.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, []);

  function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const intent = keyToIntent(event.key);
    if (!intent) return;
    event.preventDefault();

    setState((prev) => {
      // Letters/deletion are the content a published puzzle freezes
      // (PB4); cursor movement and the reject-only geometry path below
      // are unaffected -- geometry is already frozen by hints phase
      // (Story E), which every published puzzle is already in (PB3).
      if (intent.type === "letter") {
        if (prev.publishedAt !== null) return prev;
        // Hints phase locks letters too, except inside EDIT GRID mode
        // (Story H4) -- geometry stays frozen either way.
        if (prev.phase === "hints" && !isEditingGrid) return prev;
        const { grid, cursor } = place(prev.grid, prev.cursor, intent.letter);
        return { ...prev, grid, cursor };
      }
      if (intent.type === "delete") {
        if (prev.publishedAt !== null) return prev;
        // Deletion stays blocked even in EDIT GRID mode (Story H4): every
        // legal repair is an overtype once geometry is frozen, so a
        // cleared cell could only ever leave a hole.
        if (prev.phase === "hints") return prev;
        const { grid, cursor } = deleteAt(prev.grid, prev.cursor);
        return { ...prev, grid, cursor };
      }
      if (intent.type === "arrow") {
        return {
          ...prev,
          cursor: arrowKey(prev.grid, prev.cursor, intent.direction),
        };
      }
      if (intent.type === "toggleOrientation") {
        return { ...prev, cursor: toggleOrientation(prev.cursor) };
      }

      const coord = prev.cursor.current;
      const isBlack = prev.grid.at(coord.col, coord.row).kind === "black";
      const result = applyGeometryEdit(
        { grid: prev.grid, hints: {}, phase: prev.phase },
        coord,
        !isBlack,
      );
      return result.ok
        ? { ...prev, grid: result.puzzle.grid, geometryLocked: false }
        : { ...prev, geometryLocked: true };
    });
  }

  function handleCellClick(coord: Coord) {
    // A plain click on a non-focusable cell doesn't move DOM focus to its
    // focusable ancestor by itself -- without this, clicking a cell after
    // focus had moved elsewhere (a button, the title) would update the
    // cursor but leave the grid still visually and functionally blurred.
    gridRegionRef.current?.focus();
    // Clicking does not move the cursor while the grid is locked (Story
    // H4) -- otherwise the clicked cell would read as selected via
    // PuzzleGridEditor's own highlights map, independently of
    // cellAppearance's own hints-phase-locked branch ignoring selection.
    if (state.phase === "hints" && !isEditingGrid) return;
    setState((prev) => ({
      ...prev,
      cursor: moveTo(prev.grid, prev.cursor, coord),
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

  // BuilderSteps never reports the selected button, so each click here
  // is a real change (14-S4).
  function handleStep(id: BuilderStepId) {
    if (id === "publish") {
      if (state.phase === "grid") {
        setTooEarly(buildPublishClicks.current === 0 ? "lol" : "nope");
        buildPublishClicks.current += 1;
      } else if (!hintsComplete(state)) {
        setTooEarly("not-quite");
      } else {
        setIsPublishDialogOpen(true);
      }
      return;
    }
    if (state.phase === "grid") {
      if (id === "hints") setIsEnterHintsDialogOpen(true);
      return;
    }
    setIsEditingGrid(id === "build");
  }

  function handleCancelEnterHints() {
    setIsEnterHintsDialogOpen(false);
  }

  function handleConfirmEnterHints() {
    setIsEnterHintsDialogOpen(false);
    // enterHints reloads the puzzle from the database, so a letter typed
    // within the last debounce window has to be flushed first or the
    // conversion would read that cell as empty and blacken it.
    flushPendingSaves()
      .then(() => enterHints(puzzleId))
      .then(({ phase, hints, grid }) => {
        setState((prev) => ({
          ...prev,
          phase,
          hints,
          grid: deserializeGrid(grid),
        }));
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
        setIsEditingGrid(false);
        setState((prev) => ({ ...prev, publishedAt, visibility }));
      });
  }

  function handleTitleChange(title: string) {
    setState((prev) => ({ ...prev, title }));
  }

  function handleHintChange(key: string, text: string) {
    setState((prev) => ({ ...prev, hints: { ...prev.hints, [key]: text } }));
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
    geometryLocked,
    publishedAt,
  } = state;
  const isPublished = publishedAt !== null;
  const slotLookup = buildSlotLookup(grid);
  const activeKey = activeHintKey(slotLookup, cursor);
  const gridRatio = grid.cols / grid.rows;

  // No highlight at all once focus has moved somewhere that isn't the grid
  // or a hint input (a button, the title) -- otherwise the cursor cell
  // would read as selected forever, regardless of what actually has focus.
  const highlights = new Map<string, "selected" | "slot">();
  if (isFocused) {
    if (activeKey) {
      const activeSlot = slotLookup.get(activeKey)!;
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
    <div data-testid="puzzle-editor" data-ready={isReady} className=" m-auto">
      <PuzzleTitle
        value={title}
        onChange={handleTitleChange}
        disabled={isPublished}
      />
      {isPublished ? (
        <PublishedState puzzleId={puzzleId} />
      ) : (
        <BuilderSteps
          phase={phase}
          isEditingGrid={isEditingGrid}
          onStep={handleStep}
        />
      )}
      <EnterHintsDialog
        open={isEnterHintsDialogOpen}
        onConfirm={handleConfirmEnterHints}
        onCancel={handleCancelEnterHints}
      />
      <TooEarlyDialog kind={tooEarly} onClose={() => setTooEarly(null)} />
      {isPublishDialogOpen && (
        <PublishDialog
          findings={publishReadiness({ grid, hints, phase })}
          onPublish={handlePublish}
          onCancel={() => setIsPublishDialogOpen(false)}
        />
      )}
      {/* The Preview toggle's row stays, empty, outside the build phase, so
          the grid doesn't move when the phase changes (14-S4). */}
      <div className="mt-[27px] mb-3 flex h-6 items-center">
        {phase === "grid" && (
          <PreviewToggle
            isPreviewing={isPreviewing}
            onToggle={() => setIsPreviewing((prev) => !prev)}
          />
        )}
      </div>
      {geometryLocked && (
        <p
          data-testid="geometry-locked-message"
          className="text-help text-ink-2"
        >
          Geometry is locked in hints phase
        </p>
      )}
      <div
        data-testid="editor-layout"
        className="flex flex-col gap-6 lg:flex-row lg:items-start"
        onFocus={handleEditorFocus}
        onBlur={handleEditorBlur}
      >
        <div
          ref={gridRegionRef}
          data-testid="grid-region"
          tabIndex={0}
          onKeyDown={handleGridKeyDown}
          className="max-w-full outline-none lg:max-w-[45%]"
          style={{
            width: `min(calc((100vh - ${VERTICAL_ALLOWANCE_PX}px) * ${gridRatio}), 640px)`,
          }}
        >
          <PuzzleGrid
            grid={grid}
            highlights={highlights}
            mode={isPreviewing ? "preview" : "build"}
            isHintsPhase={phase === "hints"}
            isEditingGrid={isEditingGrid}
            onCellClick={handleCellClick}
          />
        </div>
        {phase === "hints" && (
          <div
            data-testid="hints-region"
            className="flex-1 overflow-y-auto"
            style={{ maxHeight: `calc(100vh - ${VERTICAL_ALLOWANCE_PX}px)` }}
          >
            <HintsPanel
              grid={grid}
              slots={slotLookup}
              hints={hints}
              activeKey={activeKey}
              disabled={isPublished || isEditingGrid}
              onHintChange={handleHintChange}
              onHintFocus={handleHintFocus}
            />
          </div>
        )}
      </div>
    </div>
  );
}
