import type { Cell, Grid } from '../../engine/grid';
import { buildCellNumberLookup, cellNumberKey } from '../../lib/cell-number-lookup';
import { GridCell } from './GridCell';

export function PuzzleGrid({ grid }: { grid: Grid }) {
  const numbers = buildCellNumberLookup(grid);
  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row) as Cell;
      const number = numbers.get(cellNumberKey({ col, row }));
      cells.push(
        <div
          key={`${col},${row}`}
          data-testid="grid-cell"
          data-coord={`${col},${row}`}
          data-kind={cell.kind}
        >
          <GridCell cell={cell} number={number} />
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
