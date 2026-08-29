import type { Cell, Coord, Grid } from '../../engine/grid';
import { buildCellNumberLookup, cellNumberKey } from '../../lib/cell-number-lookup';
import { GridCell } from './GridCell';

export function PuzzleGrid({
  grid,
  highlights,
  onCellClick,
}: {
  grid: Grid;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  onCellClick?: (coord: Coord) => void;
}) {
  const numbers = buildCellNumberLookup(grid);
  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row) as Cell;
      const number = numbers.get(cellNumberKey({ col, row }));
      const highlight = highlights?.get(cellNumberKey({ col, row }));
      cells.push(
        <div
          key={`${col},${row}`}
          data-testid="grid-cell"
          data-coord={`${col},${row}`}
          data-kind={cell.kind}
          data-selected={highlight === 'selected' ? 'true' : undefined}
          data-highlight={highlight}
        >
          <GridCell
            cell={cell}
            number={number}
            highlight={highlight}
            onClick={onCellClick ? () => onCellClick({ col, row }) : undefined}
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
