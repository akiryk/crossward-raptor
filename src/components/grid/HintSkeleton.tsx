import type { Grid } from '../../engine/grid';
import { slotsWithNumbers } from '../../engine/numbering';
import { convertEmptyCellsToBlack } from '../../engine/phase';

const COLUMNS = [
  { orientation: 'across', heading: 'Across' },
  { orientation: 'down', heading: 'Down' },
] as const;

/** The build phase's stand-in for the hints to come (14-S5): one
 *  placeholder per word, counted as the grid numbers them. Decorative. */
export function HintSkeleton({ grid }: { grid: Grid }) {
  const slots = slotsWithNumbers(convertEmptyCellsToBlack(grid));

  return (
    <div data-testid="hint-skeleton" aria-hidden="true" className="@container min-w-0 flex-1 @max-[952px]/editor:hidden">
      {/* One column below 650px of room beside the grid, a 1290px window (15-S2). */}
      <div className="flex flex-col gap-8 @min-[650px]:flex-row">
        {COLUMNS.map(({ orientation, heading }) => (
          <div
            key={orientation}
            data-testid="hint-skeleton-column"
            data-orientation={orientation}
            className="min-w-0 flex-1"
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
