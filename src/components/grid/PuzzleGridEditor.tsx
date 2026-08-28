'use client';

import { useEffect, useRef, useState } from 'react';
import type { Cell, Coord, Grid } from '../../engine/grid';
import type { CursorState } from '../../engine/cursor';
import { arrowKey, deleteAt, moveTo, place } from '../../engine/cursor';
import { deserializeGrid, serializeGrid, type SerializedGrid } from '../../lib/puzzle-storage';
import { buildCellNumberLookup, cellNumberKey } from '../../lib/cell-number-lookup';
import { keyToIntent } from '../../lib/keyboard-intent';
import { saveGrid } from '../../app/puzzles/actions';
import { GridCell } from './GridCell';

const SAVE_DEBOUNCE_MS = 500;

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
}: {
  puzzleId: string;
  initialGrid: SerializedGrid;
}) {
  const [state, setState] = useState<{ grid: Grid; cursor: CursorState }>(() => {
    const grid = deserializeGrid(initialGrid);
    return { grid, cursor: { current: firstActiveCell(grid), orientation: 'across' } };
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
    function handleKeyDown(event: KeyboardEvent) {
      const intent = keyToIntent(event.key);
      if (!intent) return;
      event.preventDefault();

      setState((prev) => {
        if (intent.type === 'letter') {
          return place(prev.grid, prev.cursor, intent.letter);
        }
        if (intent.type === 'delete') {
          return deleteAt(prev.grid, prev.cursor);
        }
        return { grid: prev.grid, cursor: arrowKey(prev.grid, prev.cursor, intent.direction) };
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleCellClick(coord: Coord) {
    setState((prev) => ({ grid: prev.grid, cursor: moveTo(prev.grid, prev.cursor, coord) }));
  }

  const { grid, cursor } = state;
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
    <div
      className="grid w-full border border-grid-line"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        aspectRatio: `${grid.cols} / ${grid.rows}`,
      }}
    >
      {cells}
    </div>
  );
}
