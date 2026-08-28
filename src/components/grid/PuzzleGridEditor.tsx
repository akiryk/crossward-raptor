'use client';

import { useEffect, useRef, useState } from 'react';
import type { Cell, Coord, Grid } from '../../engine/grid';
import type { CursorState } from '../../engine/cursor';
import { arrowKey, deleteAt, moveTo, place } from '../../engine/cursor';
import type { Phase } from '../../engine/puzzle';
import { applyGeometryEdit } from '../../engine/phase';
import { deserializeGrid, serializeGrid, type SerializedGrid } from '../../lib/puzzle-storage';
import { buildCellNumberLookup, cellNumberKey } from '../../lib/cell-number-lookup';
import { keyToIntent } from '../../lib/keyboard-intent';
import { saveGrid, enterHints } from '../../app/puzzles/actions';
import { GridCell } from './GridCell';
import { PhaseControls } from './PhaseControls';

const SAVE_DEBOUNCE_MS = 500;
const LOCKED_MESSAGE_MS = 2000;

interface EditorState {
  grid: Grid;
  cursor: CursorState;
  phase: Phase;
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

export function PuzzleGridEditor({
  puzzleId,
  initialGrid,
  initialPhase,
}: {
  puzzleId: string;
  initialGrid: SerializedGrid;
  initialPhase: Phase;
}) {
  const [state, setState] = useState<EditorState>(() => {
    const grid = deserializeGrid(initialGrid);
    return {
      grid,
      cursor: { current: firstActiveCell(grid), orientation: 'across' },
      phase: initialPhase,
      geometryLocked: false,
    };
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
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
    if (!state.geometryLocked) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, geometryLocked: false }));
    }, LOCKED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [state.geometryLocked]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleCellClick(coord: Coord) {
    setState((prev) => ({ ...prev, cursor: moveTo(prev.grid, prev.cursor, coord) }));
  }

  function handleEnterHints() {
    // enterHintsPhase always transitions grid -> hints deterministically, so
    // the UI updates immediately rather than waiting on the round trip —
    // same "local state first, persist silently in the background" pattern
    // as autosave above.
    setState((prev) => ({ ...prev, phase: 'hints' }));
    enterHints(puzzleId).catch((error) => {
      console.error('Failed to enter hints phase', error);
    });
  }

  const { grid, cursor, phase, geometryLocked } = state;
  const numbers = buildCellNumberLookup(grid);
  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row) as Cell;
      const number = numbers.get(cellNumberKey({ col, row }));
      const isSelected = cursor.current.col === col && cursor.current.row === row;
      cells.push(
        <div
          key={`${col},${row}`}
          data-testid="grid-cell"
          data-coord={`${col},${row}`}
          data-kind={cell.kind}
          data-selected={isSelected ? 'true' : undefined}
        >
          <GridCell
            cell={cell}
            number={number}
            isSelected={isSelected}
            onClick={() => handleCellClick({ col, row })}
          />
        </div>
      );
    }
  }

  return (
    <div>
      <PhaseControls phase={phase} onEnterHints={handleEnterHints} />
      {geometryLocked && (
        <p data-testid="geometry-locked-message">Geometry is locked in hints phase</p>
      )}
      <div
        className="grid w-full border border-grid-line"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          aspectRatio: `${grid.cols} / ${grid.rows}`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
