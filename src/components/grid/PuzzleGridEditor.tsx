'use client';

import { useEffect, useRef, useState } from 'react';
import type { Coord, Grid } from '../../engine/grid';
import { clearLetters } from '../../engine/grid';
import type { CursorState } from '../../engine/cursor';
import { arrowKey, deleteAt, moveTo, place } from '../../engine/cursor';
import type { Phase } from '../../engine/puzzle';
import { applyGeometryEdit } from '../../engine/phase';
import { deserializeGrid, serializeGrid, type SerializedGrid } from '../../lib/puzzle-storage';
import { cellNumberKey } from '../../lib/cell-number-lookup';
import { buildSlotLookup, activeHintKey } from '../../lib/hint-lookup';
import { keyToIntent } from '../../lib/keyboard-intent';
import { saveGrid, saveHints, enterHints } from '../../app/puzzles/actions';
import { PuzzleGrid } from './PuzzleGrid';
import { PhaseControls } from './PhaseControls';
import { HintsPanel } from './HintsPanel';
import { ClearLettersButton } from './ClearLettersButton';

const SAVE_DEBOUNCE_MS = 500;
const LOCKED_MESSAGE_MS = 2000;

interface EditorState {
  grid: Grid;
  cursor: CursorState;
  phase: Phase;
  hints: Record<string, string>;
  geometryLocked: boolean;
}

function firstActiveCell(grid: Grid): Coord {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === 'active') {
        return { col, row };
      }
    }
  }
  throw new Error('firstActiveCell: grid has no active cells');
}

function countEmptyActiveCells(grid: Grid): number {
  let count = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind === 'active' && cell.letter === null) count++;
    }
  }
  return count;
}

export function PuzzleGridEditor({
  puzzleId,
  initialGrid,
  initialPhase,
  initialHints,
}: {
  puzzleId: string;
  initialGrid: SerializedGrid;
  initialPhase: Phase;
  initialHints: Record<string, string>;
}) {
  const [state, setState] = useState<EditorState>(() => {
    const grid = deserializeGrid(initialGrid);
    return {
      grid,
      cursor: { current: firstActiveCell(grid), orientation: 'across' },
      phase: initialPhase,
      hints: initialHints,
      geometryLocked: false,
    };
  });
  const isFirstGridRender = useRef(true);
  const isFirstHintsRender = useRef(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isFirstGridRender.current) {
      isFirstGridRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveGrid(puzzleId, serializeGrid(state.grid)).catch((error) => {
        console.error('Failed to save puzzle grid', error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.grid, puzzleId]);

  useEffect(() => {
    if (isFirstHintsRender.current) {
      isFirstHintsRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveHints(puzzleId, state.hints).catch((error) => {
        console.error('Failed to save puzzle hints', error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.hints, puzzleId]);

  useEffect(() => {
    if (!state.geometryLocked) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, geometryLocked: false }));
    }, LOCKED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [state.geometryLocked]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const intent = keyToIntent(event.key);
      if (!intent) return;
      event.preventDefault();

      setState((prev) => {
        if (intent.type === 'letter') {
          const { grid, cursor } = place(prev.grid, prev.cursor, intent.letter);
          return { ...prev, grid, cursor };
        }
        if (intent.type === 'delete') {
          const { grid, cursor } = deleteAt(prev.grid, prev.cursor);
          return { ...prev, grid, cursor };
        }
        if (intent.type === 'arrow') {
          return { ...prev, cursor: arrowKey(prev.grid, prev.cursor, intent.direction) };
        }

        const coord = prev.cursor.current;
        const isBlack = prev.grid.at(coord.col, coord.row).kind === 'black';
        const result = applyGeometryEdit(
          { grid: prev.grid, hints: {}, phase: prev.phase },
          coord,
          !isBlack
        );
        return result.ok
          ? { ...prev, grid: result.puzzle.grid, geometryLocked: false }
          : { ...prev, geometryLocked: true };
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    // isReady must flip exactly when the listener above is live, so tests
    // (and any other consumer) can wait for a real "can respond to input"
    // signal rather than racing hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleCellClick(coord: Coord) {
    setState((prev) => ({ ...prev, cursor: moveTo(prev.grid, prev.cursor, coord) }));
  }

  function handleClearLetters() {
    setState((prev) => ({ ...prev, grid: clearLetters(prev.grid) }));
  }

  function handleEnterHints() {
    // Unlike the old grid-only-changes-client-side assumption, the
    // transition now blackens empty cells server-side (enterHintsPhase
    // needs the puzzle's real hints, which the client doesn't hold — same
    // reason this already ran server-side). phase, hints, and grid all
    // apply together once the response lands, rather than flipping phase
    // optimistically: doing that would let the phase badge read "hints"
    // for a moment before the blackened grid actually renders.
    enterHints(puzzleId)
      .then(({ phase, hints, grid }) => {
        setState((prev) => ({ ...prev, phase, hints, grid: deserializeGrid(grid) }));
      })
      .catch((error) => {
        console.error('Failed to enter hints phase', error);
      });
  }

  function handleHintChange(key: string, text: string) {
    setState((prev) => ({ ...prev, hints: { ...prev.hints, [key]: text } }));
  }

  function handleHintFocus(key: string) {
    setState((prev) => {
      const slot = buildSlotLookup(prev.grid).get(key);
      return slot
        ? { ...prev, cursor: { current: slot.start, orientation: slot.orientation } }
        : prev;
    });
  }

  const { grid, cursor, phase, hints, geometryLocked } = state;
  const slotLookup = buildSlotLookup(grid);
  const activeKey = activeHintKey(slotLookup, cursor);

  const highlights = new Map<string, 'selected' | 'slot'>();
  if (activeKey) {
    const activeSlot = slotLookup.get(activeKey)!;
    for (const cell of activeSlot.cells) {
      highlights.set(cellNumberKey(cell), 'slot');
    }
  }
  highlights.set(cellNumberKey(cursor.current), 'selected');

  return (
    <div data-testid="puzzle-editor" data-ready={isReady}>
      <div data-testid="editor-actions" className="flex flex-wrap items-center gap-3">
        <PhaseControls
          phase={phase}
          emptyCellCount={countEmptyActiveCells(grid)}
          onEnterHints={handleEnterHints}
        />
        <ClearLettersButton onConfirm={handleClearLetters} />
      </div>
      {geometryLocked && (
        <p data-testid="geometry-locked-message">Geometry is locked in hints phase</p>
      )}
      <PuzzleGrid grid={grid} highlights={highlights} onCellClick={handleCellClick} />
      {phase === 'hints' && (
        <HintsPanel
          slots={slotLookup}
          hints={hints}
          activeKey={activeKey}
          onHintChange={handleHintChange}
          onHintFocus={handleHintFocus}
        />
      )}
    </div>
  );
}
