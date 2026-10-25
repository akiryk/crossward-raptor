import { useId } from 'react';

// Story 14-S2. The library's fixed puzzle icon, from the human's export: an
// outlined 3×3 grid with three dark cells, the same on every row.
const CELLS = [1, 12, 23];
const DARK = new Set(['1,0', '0,1', '2,2']);

export function CrosswordIcon() {
  const clip = useId();
  return (
    <svg
      aria-hidden="true"
      data-testid="puzzle-icon"
      width="34"
      height="34"
      viewBox="0 0 34 34"
      className="shrink-0"
    >
      <g clipPath={`url(#${clip})`}>
        <rect width="34" height="34" className="fill-primary" />
        {CELLS.flatMap((y, row) => CELLS.map((x, col) => (
          <rect
            key={`${col},${row}`}
            x={x}
            y={y}
            width="10"
            height="10"
            className={DARK.has(`${col},${row}`) ? 'fill-primary' : 'fill-inverse'}
          />
        )))}
        <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" fill="none" className="stroke-primary" />
      </g>
      <defs>
        <clipPath id={clip}>
          <rect width="34" height="34" rx="8" />
        </clipPath>
      </defs>
    </svg>
  );
}
