import type { Grid } from '../../engine/grid';
import { slotsWithNumbers } from '../../engine/numbering';
import { convertEmptyCellsToBlack } from '../../engine/phase';
import { twoHintColumnsClass } from '../../lib/grid-max';

const COLUMNS = [
  { orientation: 'across', heading: 'Across' },
  { orientation: 'down', heading: 'Down' },
] as const;

/** The build phase's stand-in for the hints to come (14-S5): one
 *  placeholder per word, counted as the grid numbers them. Decorative. */
export function HintSkeleton({ grid, gridPx = 700 }: { grid: Grid; gridPx?: number }) {
  const slots = slotsWithNumbers(convertEmptyCellsToBlack(grid));

  return (
    // Story 18-S7: the hints list's scrollbar room (the gutter needs a
    // non-visible overflow), so Create Hints moves nothing sideways.
    <div data-testid="hint-skeleton" aria-hidden="true" className="@container min-w-0 flex-1 overflow-hidden [scrollbar-gutter:stable] @max-[1092px]/editor:hidden">
      {/* One column below a 1430px window (15-S2, 17-S7, 21-S9). */}
      <div className={`flex flex-col gap-8 ${twoHintColumnsClass(gridPx)}`}>
        {COLUMNS.map(({ orientation, heading }) => (
          <div
            key={orientation}
            data-testid="hint-skeleton-column"
            data-orientation={orientation}
            // Story 18-S7: the Hint Inputs' 6px inset; the lines still run
            // to the column's right edge.
            className="min-w-0 flex-1 pl-[6px]"
          >
            <p className="text-title-4 text-muted pt-2">{heading}</p>
            <div className="mt-8">
              {slots
                .filter((slot) => slot.orientation === orientation)
                .map((slot) => (
                  <div
                    key={slot.number}
                    data-testid="hint-skeleton-row"
                    className="relative flex h-[18px] items-start gap-3 not-first:mt-[40px]"
                  >
                    <span
                      data-testid="hint-skeleton-dot"
                      className="bg-fill-muted size-[18px] shrink-0 rounded-full"
                    />
                    <span
                      data-testid="hint-skeleton-line"
                      className="bg-line-muted mt-[13px] h-px min-w-0 flex-1"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
