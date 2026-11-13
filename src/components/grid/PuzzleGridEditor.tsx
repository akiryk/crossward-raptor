"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { flushSync } from "react-dom";
import type { Coord, Grid, Orientation } from "../../engine/grid";
import { withLetter } from "../../engine/grid";
import type { CursorState } from "../../engine/cursor";
import {
  arrowKey,
  moveTo,
  place,
  toggleOrientation,
} from "../../engine/cursor";
import type { Phase } from "../../engine/puzzle";
import { intendedGeometry } from "../../engine/puzzle-geometry";
import { hintsComplete } from "../../engine/hints";
import {
  deserializeGrid,
  deserializeLockedWords,
  serializeGrid,
  type SerializedGrid,
} from "../../lib/puzzle-storage";
import {
  clearOutsideLockedWords,
  lockTargetAt,
  sameWord,
  tickTarget,
  toggleLock,
  wordHoldsCell,
  type LockedWord,
} from "../../lib/locked-words";
import { deleteProtected, isCellProtected, placeProtected } from "../../lib/locked-keys";
import { cellNumberKey } from "../../lib/cell-number-lookup";
import { sisterWord } from "../../lib/cell-appearance";
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
import { BuildProgress } from "./BuildProgress";
import { TooEarlyDialog } from "./TooEarlyDialog";
import { PublishDialog } from "./PublishDialog";
import { PuzzleTitle } from "../puzzle/PuzzleTitle";
import { PlayerHints } from "../play/PlayerHints";
import { slotsWithNumbers } from "../../engine/numbering";
import { closeRebus, rebusIntent } from "../../lib/rebus-entry";
import { buildWord, wouldBeWord } from "../../lib/build-word";
import { RebusControl } from "./RebusControl";
import { LockWordControl } from "./LockWordControl";
import { StartOverDialog, StartOverLink } from "./StartOverDialog";
import { gridMaxPx } from "../../lib/grid-max";

const SAVE_DEBOUNCE_MS = 500;
// How long the cursor stays in an unlocked word before its lock button
// shows (21-S2), and the mouse's hover wait (21-S10): 2 seconds (22-S6).
const LOCK_BUTTON_DELAY_MS = 2000;
// Room for the lock button left of the grid: 32px, the 1px line and 3px to
// spare (21-S12).
const LOCK_ROOM_PX = 36;
// Preview's toggle fades the grid's colors over 500ms (22-S5); the
// transition stays in place a little longer, so the fade ends before it goes.
const PREVIEW_FADE_WINDOW_MS = 600;

interface EditorState {
  grid: Grid;
  /** The build phase's locked words, saved with the grid (21-S2). */
  lockedWords: LockedWord[];
  cursor: CursorState;
  phase: Phase;
  hints: Record<string, string>;
  title: string;
  publishedAt: Date | null;
  visibility: Visibility;
}

// A mouse resting on a word (21-S10): the cell it last moved onto, and the
// wait for the run through that cell in the cursor's direction. Moving
// within the run keeps the same `wait`, so it runs on.
interface LockHover {
  coord: Coord;
  wait: { run: string | null; isDue: boolean };
  /** A ticked end cell's word (21-S13), kept while the mouse is on that
   *  cell, the word's cells or its button. */
  tickWord?: LockedWord;
  /** On the ticked end cell itself: the cursor's direction the word was
   *  picked for. A turn there picks again. */
  pickedFor?: Orientation;
}

function wordKey(word: LockedWord): string {
  return `${word.col},${word.row} ${word.orientation} ${word.length}`;
}

function runKey(grid: Grid, coord: Coord, orientation: Orientation): string | null {
  const cells = buildWord(grid, coord, orientation);
  return cells ? wordKey({ ...cells[0], orientation, length: cells.length }) : null;
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
      lockedWords: deserializeLockedWords(initialGrid),
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
  const lastSavedLockedWordsRef = useRef(state.lockedWords);
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
  // The grid's colors fade only for a while after Preview turns on or off
  // (22-S5): set in the same render as the mode, so the transition is in
  // place for it. Each toggle counts, restarting the window.
  const [previewFade, setPreviewFade] = useState({ count: 0, isFading: false });
  function changePreview(on: boolean) {
    if (on && !isPreviewing) {
      const { col, row } = state.cursor.current;
      setIsPreviewCursorHidden(intendedGeometry(state.grid).at(col, row).kind === "black");
    }
    if (on !== isPreviewing) setPreviewFade((prev) => ({ count: prev.count + 1, isFading: true }));
    setIsPreviewing(on);
  }
  // Lock Grid Letters (14-S12): the hints phase's guard against changing a
  // letter by accident. A way of working, like Preview, so not persisted.
  const [isLettersLocked, setIsLettersLocked] = useState(false);
  // Preview Hints (17-S9): the hints list shows the hints as a player sees
  // them; everything else is as when editing. Not persisted.
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
  // The cursor whose word's lock button shows (21-S2): set once the cursor
  // has stayed `LOCK_BUTTON_DELAY_MS`, or by toggling the lock. Every key or
  // move makes a new cursor, so the wait starts again.
  const [lockDwell, setLockDwell] = useState<CursorState | null>(null);
  // The button beside the word shows only with the grid at its full width,
  // the puzzle's own (21-S9), and room for the button left of it (21-S12);
  // otherwise Lock Word in the toggle row replaces it (21-S5).
  const [hasLockRoom, setHasLockRoom] = useState(true);
  const [lockHover, setLockHover] = useState<LockHover | null>(null);
  const editorLayoutRef = useRef<HTMLDivElement>(null);
  const lockControlRef = useRef<HTMLButtonElement>(null);
  // The Hint Box's word (15-S4): the cursor's, or the one it last showed
  // while the cursor's cell has no word in its direction.
  const [boxKey, setBoxKey] = useState<string | null>(null);
  const boxInputRef = useRef<HTMLTextAreaElement>(null);
  const [isEnterHintsDialogOpen, setIsEnterHintsDialogOpen] = useState(false);
  const [isNotQuiteOpen, setIsNotQuiteOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isStartOverOpen, setIsStartOverOpen] = useState(false);
  // Set on confirming Start Over: once the dialog has closed (and Modal has
  // returned focus to its opener), the grid takes focus (20-S1).
  const focusGridAfterStartOverRef = useRef(false);
  // The hints 3 Publish found blank, each until its text next changes
  // (17-S1). Not persisted.
  const [rebusValue, setRebusValue] = useState<string | null>(null);
  const rebusOpenRef = useRef(false);
  const [missingKeys, setMissingKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (lastSavedGridRef.current === state.grid && lastSavedLockedWordsRef.current === state.lockedWords) return;
    lastSavedGridRef.current = state.grid;
    lastSavedLockedWordsRef.current = state.lockedWords;
    gridSaveTimer.current = setTimeout(() => {
      gridSaveTimer.current = null;
      saveGrid(puzzleId, serializeGrid(state.grid, state.lockedWords)).catch((error) => {
        console.error("Failed to save puzzle grid", error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (gridSaveTimer.current !== null) clearTimeout(gridSaveTimer.current);
    };
  }, [state.grid, state.lockedWords, puzzleId]);

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

  // A locked word's letters and end cells take no rebus (21-S3).
  function canRebus() {
    return (
      state.publishedAt === null &&
      !isLettersLocked &&
      !(isPreviewing && isPreviewCursorHidden) &&
      !isCellProtected(state.grid, state.lockedWords, state.cursor.current)
    );
  }

  function openRebus() {
    if (!canRebus()) return;
    const { col, row } = state.cursor.current;
    const cell = state.grid.at(col, row);
    rebusOpenRef.current = true;
    setRebusValue(cell.kind === "active" ? cell.letter ?? "" : "");
  }

  function closeRebusEntry(advance: boolean) {
    if (!rebusOpenRef.current) return;
    rebusOpenRef.current = false;
    const text = rebusValue ?? "";
    setRebusValue(null);
    setState((prev) => {
      const canClear = prev.phase !== "hints";
      const result = closeRebus(prev.grid, prev.cursor, text, { advance, canClear });
      if (!isPreviewing) return { ...prev, grid: result.grid, cursor: result.cursor };
      // The cursor moves over Preview's words once the rebus is placed, as
      // after a letter (previewKey): the cell may be Preview-black before.
      const shown = closeRebus(intendedGeometry(result.grid), prev.cursor, text, { advance, canClear });
      return { ...prev, grid: result.grid, cursor: shown.cursor };
    });
    if (advance) gridRegionRef.current?.focus({ preventScroll: true });
  }

  // The fade's window ends after the fade (22-S5); outside it, every color
  // change is instant.
  const fadeCount = previewFade.count;
  useEffect(() => {
    if (fadeCount === 0) return;
    const timer = setTimeout(
      () => setPreviewFade((prev) => (prev.count === fadeCount ? { ...prev, isFading: false } : prev)),
      PREVIEW_FADE_WINDOW_MS,
    );
    return () => clearTimeout(timer);
  }, [fadeCount]);

  // Only time with the grid focused counts toward the button's wait (21-S7).
  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(() => setLockDwell(state.cursor), LOCK_BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.cursor, state.grid, isFocused]);

  // The grid's width at most (21-S9); a short window scrolls the page.
  const gridPx = gridMaxPx(state.grid.cols);
  useEffect(() => {
    const region = gridRegionRef.current;
    if (!region) return;
    // A centered grid moves without resizing, so the window's resize counts.
    const measure = () => {
      const rect = region.getBoundingClientRect();
      setHasLockRoom(rect.width >= gridPx - 0.5 && rect.left + window.scrollX >= LOCK_ROOM_PX - 0.25);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gridPx]);

  // The hover's wait, counted from the mouse moving onto the word (21-S10).
  const hoverWait = lockHover?.wait ?? null;
  useEffect(() => {
    if (!hoverWait || hoverWait.isDue) return;
    const timer = setTimeout(() => {
      setLockHover((prev) =>
        prev && prev.wait === hoverWait ? { ...prev, wait: { ...hoverWait, isDue: true } } : prev,
      );
    }, LOCK_BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hoverWait]);

  function handleToggleLock() {
    setState((prev) => {
      const target = lockTargetAt(prev.grid, prev.lockedWords, prev.cursor);
      return target ? { ...prev, lockedWords: toggleLock(prev.lockedWords, target.word) } : prev;
    });
    // The button stays, in its new state.
    setLockDwell(state.cursor);
  }

  // The mouse moved onto a cell (null: the hover ended). Within the same
  // run its wait runs on; any other cell starts a new one (21-S10). A
  // ticked end cell's run is the word `tickTarget` picks there, which stays
  // on that word's cells whatever the cursor's direction (21-S13).
  function handleHoverCell(coord: Coord | null) {
    if (!coord) {
      setLockHover(null);
      return;
    }
    const { orientation } = state.cursor;
    const tickWord = isLockShown ? tickTarget(state.grid, state.lockedWords, coord, orientation) : null;
    setLockHover((prev) => {
      if (tickWord) {
        const run = wordKey(tickWord);
        return { coord, wait: prev?.wait.run === run ? prev.wait : { run, isDue: false }, tickWord, pickedFor: orientation };
      }
      if (prev?.tickWord && wordHoldsCell(prev.tickWord, coord)) {
        return { coord, wait: prev.wait, tickWord: prev.tickWord };
      }
      const run = runKey(state.grid, coord, orientation);
      return prev && run !== null && prev.wait.run === run ? { coord, wait: prev.wait } : { coord, wait: { run, isDue: false } };
    });
  }

  useEffect(() => {
    if (isStartOverOpen || !focusGridAfterStartOverRef.current) return;
    focusGridAfterStartOverRef.current = false;
    gridRegionRef.current?.focus({ preventScroll: true });
  }, [isStartOverOpen]);

  // An open rebus entry is placed as leaving it does, and the grid keeps
  // focus for after the dialog (20-S1).
  function handleStartOver() {
    if (rebusOpenRef.current) {
      closeRebusEntry(false);
      gridRegionRef.current?.focus({ preventScroll: true });
    }
    setIsStartOverOpen(true);
  }

  // Every cell white and empty, the size kept, and no lock left; or, with
  // Keep Locked Words (21-S6), every cell outside a locked word, the locks
  // kept. The cursor starts over on the first cell, Across. Saved by the
  // grid's autosave; no undo.
  function handleConfirmStartOver(keepLockedWords: boolean) {
    const lockedWords = keepLockedWords ? state.lockedWords : [];
    const next = clearOutsideLockedWords(state.grid, lockedWords);
    setState((prev) => ({
      ...prev,
      grid: next,
      lockedWords,
      cursor: { current: { col: 0, row: 0 }, orientation: "across" },
    }));
    if (isPreviewing) {
      setIsPreviewCursorHidden(intendedGeometry(next).at(0, 0).kind === "black");
    }
    focusGridAfterStartOverRef.current = true;
    setIsStartOverOpen(false);
  }

  function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (rebusValue === null && rebusIntent(event.key, false) === "open") {
      if (canRebus()) {
        event.preventDefault();
        openRebus();
      }
      return;
    }
    const intent = keyToIntent(event.key);
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
        // A locked word's letters and end cells hold (21-S3).
        const { grid, cursor } = placeProtected(prev.grid, prev.lockedWords, prev.cursor, intent.letter);
        return { ...prev, grid, cursor };
      }
      if (intent.type === "delete") {
        if (prev.publishedAt !== null) return prev;
        // Deletion stays blocked in the hints phase (Story H4): every
        // legal repair is an overtype once geometry is frozen, so a
        // cleared cell could only ever leave a hole.
        if (prev.phase === "hints") return prev;
        const { grid, cursor } = deleteProtected(prev.grid, prev.lockedWords, prev.cursor);
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
      // Locked cells hold with Preview on too (21-S3).
      const grid = placeProtected(prev.grid, prev.lockedWords, prev.cursor, intent.letter).grid;
      const { cursor } = place(intendedGeometry(grid), prev.cursor, intent.letter);
      return { ...prev, grid, cursor };
    }
    if (intent.type === "delete") {
      if (prev.publishedAt !== null) return prev;
      const deleted = deleteProtected(shown, prev.lockedWords, prev.cursor);
      if (deleted.grid === shown) {
        return deleted.cursor === prev.cursor ? prev : { ...prev, cursor: deleted.cursor };
      }
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
    const next = state.phase === "hints"
      ? wordMoveTo(state.grid, state.cursor, coord)
      : moveTo(state.grid, state.cursor, coord);
    setState((prev) => ({ ...prev, cursor: next }));
    // A click ends the hover and the cursor takes over (21-S10): the hover's
    // button, if for the cursor's new word, stays with no new second.
    const nextTarget = lockTargetAt(state.grid, state.lockedWords, next);
    if (hoverTarget && nextTarget && wordKey(nextTarget.word) === wordKey(hoverTarget.word)) {
      setLockDwell(next);
    }
    setLockHover(null);
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
      saveGrid(puzzleId, serializeGrid(state.grid, state.lockedWords)),
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
          // The conversion drops the locked words: the hints phase has none.
          return { ...prev, phase, hints, grid: next, lockedWords: [], cursor: startCursor(next, phase) };
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
    lockedWords,
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
  // In the build phase only the cursor's word is blue-medium, not the
  // other words in its row or column (21-S1): the word its cell would
  // belong to with a letter (22-S5), except where no letter can be typed,
  // a locked word's letter or end cell, which keeps its own word.
  const cursorWordOf = isCellProtected(grid, lockedWords, cursor.current) ? buildWord : wouldBeWord;
  const cursorWordCells = isPreviewing || phase === "hints"
    ? undefined
    : cursorWordOf(grid, cursor.current, cursor.orientation) ?? [];
  const cursorWord = cursorWordCells && new Set(cursorWordCells.map(cellNumberKey));
  // The word's 180° image, its sister, is pale blue (25-S1).
  const cursorSister = cursorWordCells && new Set(sisterWord(grid, cursorWordCells).map(cellNumberKey));

  // Locks show only in the build phase with Preview off (21-S2). The
  // button and its outline show at once in a locked word, after the wait in
  // another word of 3 or more letters, and only while the grid (or a lock
  // button) has focus. The toggle row's Lock Word is enabled at once (21-S5).
  const isLockShown = phase === "grid" && !isPublished && !isPreviewing;
  // The build progress (22-S2): a daily or Sunday's build phase with
  // Preview on, in place of Rebus and Lock Word.
  const isProgressShown =
    phase === "grid" && !isPublished && isPreviewing && grid.cols === grid.rows && (grid.cols === 15 || grid.cols === 21);
  const cursorTarget = isLockShown ? lockTargetAt(grid, lockedWords, cursor) : null;
  const cursorLockTarget =
    isFocused && cursorTarget && (cursorTarget.isLocked || lockDwell === cursor) ? cursorTarget : null;
  const isRowLockEnabled = isFocused && cursorTarget !== null;

  // The hovered word's button wins once its wait has passed, at once for a
  // locked word (21-S17), focused or not; only where the button beside the
  // word is used, with no rebus entry open (21-S10). A turn of the cursor puts a new run under the mouse, whose
  // wait starts over. On a ticked end cell, a turn, or its word's tick
  // going (unlocked by the keyboard), picks again; the same word keeps its
  // wait (21-S13).
  const tickWord = lockHover?.tickWord ?? null;
  const isTickWordLocked = tickWord !== null && lockedWords.some((word) => sameWord(word, tickWord));
  if (lockHover?.pickedFor && (lockHover.pickedFor !== cursor.orientation || !isTickWordLocked)) {
    const repick = isLockShown ? tickTarget(grid, lockedWords, lockHover.coord, cursor.orientation) : null;
    const run = repick ? wordKey(repick) : runKey(grid, lockHover.coord, cursor.orientation);
    const wait = run === lockHover.wait.run ? lockHover.wait : { run, isDue: false };
    setLockHover(
      repick
        ? { coord: lockHover.coord, wait, tickWord: repick, pickedFor: cursor.orientation }
        : { coord: lockHover.coord, wait },
    );
  }
  const hoverRun = lockHover
    ? tickWord
      ? wordKey(tickWord)
      : runKey(grid, lockHover.coord, cursor.orientation)
    : null;
  if (lockHover && hoverRun !== lockHover.wait.run) {
    setLockHover({ coord: lockHover.coord, wait: { run: hoverRun, isDue: false } });
  }
  const isHoverUsable = isLockShown && hasLockRoom && rebusValue === null && hoverRun === lockHover?.wait.run;
  // The tick's word, once unlocked, keeps its button only while it is still
  // lockable (21-S10): its letters changing takes the button away.
  const tickWordTarget = tickWord
    ? lockTargetAt(grid, lockedWords, { current: { col: tickWord.col, row: tickWord.row }, orientation: tickWord.orientation })
    : null;
  const hoverWord = !isHoverUsable
    ? null
    : tickWord
      ? tickWordTarget && sameWord(tickWordTarget.word, tickWord)
        ? tickWordTarget
        : null
      : lockTargetAt(grid, lockedWords, { current: lockHover.coord, orientation: cursor.orientation });
  // A locked word's button shows at once, as for the cursor (21-S17), and
  // its wait counts as passed, so the button stays once it's unlocked.
  if (hoverWord?.isLocked && !lockHover!.wait.isDue) {
    setLockHover({ ...lockHover!, wait: { ...lockHover!.wait, isDue: true } });
  }
  const hoverTarget = hoverWord && (hoverWord.isLocked || lockHover!.wait.isDue) ? hoverWord : null;
  const lockTarget = hoverTarget ?? cursorLockTarget;
  // The hover's button is for the mouse: no Tab stop unless it's the
  // cursor's own.
  const isLockButtonTabStop =
    hoverTarget === null ||
    (cursorLockTarget !== null && wordKey(cursorLockTarget.word) === wordKey(hoverTarget.word));

  // The grid's button toggles the word it shows for: the hovered one's
  // leaves the cursor where it is.
  function handleToggleShownLock() {
    if (!hoverTarget) {
      handleToggleLock();
      return;
    }
    const { word } = hoverTarget;
    setState((prev) => ({ ...prev, lockedWords: toggleLock(prev.lockedWords, word) }));
    // The mouse is on the button, which stays in its new state (21-S10):
    // its word's tick going picks nothing again.
    setLockHover((prev) => (prev?.pickedFor ? { coord: prev.coord, wait: prev.wait, tickWord: prev.tickWord } : prev));
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
  // Focus moving within (the grid to its lock button) changes nothing: the
  // button would go before it could take focus (21-S2). Leaving entirely,
  // the button's wait starts over on return.
  // The toggle row's Lock Word, focused by keyboard, counts as the grid's
  // focus too (21-S5), though it sits outside editor-layout.
  function handleEditorBlur(event: ReactFocusEvent<HTMLElement>) {
    const next = event.relatedTarget as Node | null;
    if (next !== null && (editorLayoutRef.current?.contains(next) || lockControlRef.current === next)) return;
    setIsFocused(false);
    setLockDwell(null);
  }

  return (
    // Below 1092px of room, a 1140px window (17-S7), the builder is one column at
    // the grid's width, centered (15-S3). Two columns, the left one sits 12px
    // in, so the grid has the lock button's 36px of room (21-S12).
    <div
      data-testid="puzzle-editor"
      data-ready={isReady}
      className="@container/editor m-auto"
      style={{ ["--grid-max" as string]: `${gridPx}px` }}
    >
      <div className="mx-auto max-w-(--grid-max) @min-[1092px]/editor:max-w-none @min-[1092px]/editor:pl-3">
        <PuzzleTitle
          value={title}
          onChange={handleTitleChange}
          disabled={isPublished}
        />
        {/* The step row, then the toggle row, 20px apart; in one column, 16px
            (17-S8). 36px above the grid wherever the lock button can show,
            the published state wide too; else 16px (21-S12). */}
        <div
          className={`${
            isPublished ? "mb-4 @min-[1092px]/editor:mb-9" : hasLockRoom ? "mb-9" : "mb-4"
          } flex flex-col gap-4 @min-[1092px]/editor:gap-5`}
        >
          {isPublished ? (
            // Wide, as tall as the step row, so the grid doesn't move.
            <div className="@min-[1092px]/editor:min-h-8">
              <PublishedState puzzleId={puzzleId} />
            </div>
          ) : (
            <BuilderSteps phase={phase} onStep={handleStep} />
          )}
          <div className={`${isPublished ? "hidden" : "flex"} @min-[1092px]/editor:flex @min-[1092px]/editor:gap-8`}>
            <ToggleRow isPublished={isPublished} hasProgress={isProgressShown}>
              {phase === "grid" && (
                <PreviewToggle
                  isPreviewing={isPreviewing}
                  onToggle={() => changePreview(!isPreviewing)}
                />
              )}
              {phase === "hints" && !isPublished && (
                <PreviewToggle
                  data-testid="lock-letters-toggle"
                  label="Lock Grid Letters"
                  isPreviewing={isLettersLocked}
                  onToggle={() => setIsLettersLocked((prev) => !prev)}
                />
              )}
              {isProgressShown && <BuildProgress grid={grid} />}
              {!isPublished && !isProgressShown && (
                <div className="flex items-center gap-5">
                  {phase === "grid" && !hasLockRoom && (
                    <LockWordControl
                      isLocked={cursorTarget?.isLocked === true}
                      disabled={!isRowLockEnabled}
                      hidden={isPreviewing}
                      buttonRef={lockControlRef}
                      onClick={handleToggleLock}
                      onFocus={handleEditorFocus}
                      onBlur={handleEditorBlur}
                    />
                  )}
                  <RebusControl
                    variant="link"
                    isOpen={rebusValue !== null}
                    disabled={
                      (phase === "hints" && isLettersLocked) ||
                      (rebusValue === null && isCellProtected(grid, lockedWords, cursor.current))
                    }
                    onClick={() => (rebusValue === null ? openRebus() : closeRebusEntry(true))}
                  />
                </div>
              )}
            </ToggleRow>
            {/* Wide only, Preview Hints has its own panel over the hints
                list, on the toggle row's line (17-S9). */}
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
        <StartOverDialog
          open={isStartOverOpen}
          hasLockedWords={lockedWords.length > 0}
          onClearAll={() => handleConfirmStartOver(false)}
          onKeepLocked={() => handleConfirmStartOver(true)}
          onCancel={() => setIsStartOverOpen(false)}
        />
        <TooEarlyDialog open={isNotQuiteOpen} onClose={() => setIsNotQuiteOpen(false)} />
        {isPublishDialogOpen && (
          <PublishDialog
            findings={publishReadiness({ grid, hints, phase })}
            onPublish={handlePublish}
            onCancel={() => setIsPublishDialogOpen(false)}
          />
        )}
        <div
          ref={editorLayoutRef}
          data-testid="editor-layout"
          className="flex flex-col gap-6 @min-[1092px]/editor:flex-row @min-[1092px]/editor:items-start @min-[1092px]/editor:gap-8"
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
        >
          <div
            className="max-w-full shrink-0"
            style={{ width: `${gridPx}px` }}
          >
            <div
              ref={gridRegionRef}
              data-testid="grid-region"
              // A published puzzle's grid, or one with its letters locked,
              // takes no focus: no Tab stop, no click focus, no keys (14-S12).
              tabIndex={isPublished || isLettersLocked ? undefined : 0}
              onKeyDown={handleGridKeyDown}
              onFocus={() => setIsGridFocused(true)}
              onBlur={() => setIsGridFocused(false)}
              className="w-full outline-none"
            >
              <PuzzleGrid
                grid={grid}
                highlights={highlights}
                cursorWord={cursorWord}
                sisterWord={cursorSister}
                lockedWords={isLockShown ? lockedWords : undefined}
                lockTarget={lockTarget}
                hasLockButton={hasLockRoom}
                isLockButtonTabStop={isLockButtonTabStop}
                onToggleLock={handleToggleShownLock}
                onHoverCell={handleHoverCell}
                mode={isPreviewing ? "preview" : "build"}
                isFading={previewFade.isFading}
                isHintsPhase={phase === "hints"}
                isGridFocused={isGridFocused}
                isLettersLocked={phase === "hints" && isLettersLocked}
                onCellClick={handleCellClick}
                rebus={rebusValue === null ? undefined : {
                  coord: cursor.current,
                  value: rebusValue,
                  onChange: setRebusValue,
                  onClose: closeRebusEntry,
                }}
              />
            </div>
            {/* Under the grid in the build phase: the color key from the
                left, Reset Grid at the right on the key's first line, in one
                spot with or without the key (20-S4). */}
            {phase === "grid" && !isPublished && (
              <div className="flex items-start gap-5">
                <div className="min-w-0 flex-1">
                  {isPreviewing && <PreviewLegend grid={grid} />}
                </div>
                <div className="mt-4 flex h-6 shrink-0 items-center">
                  <StartOverLink onClick={handleStartOver} />
                </div>
              </div>
            )}
            {/* Below 1092px of room the Hint Box takes the list's place,
                directly under the grid (15-S4). */}
            {phase === "hints" && shownKey !== null && shownSlot && (
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
          {phase === "grid" && <HintSkeleton grid={grid} gridPx={gridPx} />}
          {phase === "hints" && (
            // Beside the grid, the list scrolls in its own box at the grid's
            // height (15-S1): size containment keeps its content from
            // stretching the row, so the grid sets the row's height. Narrow,
            // the Hint Box shows instead (15-S4). Story 18-S7: the
            // scrollbar's room is kept, so the Down column doesn't move
            // when the list starts or stops overflowing.
            <div
              data-testid="hints-region"
              className="hidden min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] @min-[1092px]/editor:block @min-[1092px]/editor:self-stretch @min-[1092px]/editor:[contain:size]"
            >
              {isHintsPreview ? (
                // Only how the hints read: no selection, no clicks (17-S9),
                // in the Hint Inputs' columns (18-S7).
                <PlayerHints slots={slotsWithNumbers(grid)} hints={hints} selectedKey={null} stacksWhenNarrow gridPx={gridPx} />
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
                  gridPx={gridPx}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
