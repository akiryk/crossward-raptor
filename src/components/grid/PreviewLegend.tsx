import type { Grid } from '../../engine/grid';
import { intendedGeometry } from '../../engine/puzzle-geometry';
import { recommendedCells } from '../../engine/slots';
import { cellNumberKey } from '../../lib/cell-number-lookup';
import { symmetricHintKeys } from '../../lib/cell-appearance';

const ITEMS = [
  { kind: 'error', text: 'Avoid breaking radial symmetry', dot: 'bg-preview-cell-error' },
  { kind: 'warning', text: 'Avoid two-letter words', dot: 'bg-preview-cell-warning' },
] as const;

/** Which Preview marks the grid shows, decided as PuzzleGrid colors its
 *  cells: a two-letter word's cell is a warning, and a missing symmetric
 *  letter outside one is an error. */
function previewMarks(grid: Grid): ReadonlySet<'error' | 'warning'> {
  const recommended = new Set(recommendedCells(intendedGeometry(grid)).map(cellNumberKey));
  const marks = new Set<'error' | 'warning'>();
  if (recommended.size > 0) marks.add('warning');
  for (const key of symmetricHintKeys(grid)) {
    if (!recommended.has(key)) marks.add('error');
  }
  return marks;
}

/** Below the build-phase grid in Preview (14-S5): names the error and
 *  warning cells present, error first. Nothing when there are none. */
export function PreviewLegend({ grid }: { grid: Grid }) {
  const marks = previewMarks(grid);
  if (marks.size === 0) return null;

  return (
    <ul data-testid="preview-legend" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {ITEMS.filter(({ kind }) => marks.has(kind)).map(({ kind, text, dot }) => (
        <li key={kind} data-testid="preview-legend-item" data-kind={kind} className="flex items-center gap-1.5">
          <span data-testid="preview-legend-dot" aria-hidden="true" className={`${dot} size-6 shrink-0 rounded-full`} />
          <span data-testid="preview-legend-text" className="text-body-normal text-primary">
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}
