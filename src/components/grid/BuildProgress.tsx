import type { Grid } from '../../engine/grid';
import { completionCount, completionPercent, isReadyForHints } from '../../engine/completion';

/** Story 22-S2. In a daily or Sunday's build phase with Preview on, the
 *  toggle row's right side: the message, the bar and "N% complete".
 *
 *  The message's 144px box and the percentage's 88px box hold their widest
 *  texts, so the bar never moves when the text changes. From a 490px window
 *  (a 474px row) all three sit on one line, the bar 180px or what's left
 *  down to about 80px. Below that the row (see `ToggleRow`'s `hasProgress`)
 *  wraps: this group's box dissolves (`contents`) so the message sits on
 *  Preview's line at the right edge and the bar and percentage take a
 *  second, full-width line. Below a 304px window the message is
 *  `body-small` in a 124px box. */
export function BuildProgress({ grid }: { grid: Grid }) {
  const count = completionCount(grid);
  const percent = completionPercent(count);
  const isReady = isReadyForHints(count);
  const share = count.total === 0 ? 0 : (100 * count.lettered) / count.total;
  return (
    <div
      data-testid="build-progress"
      className="contents min-[490px]:ml-4 min-[490px]:flex min-[490px]:min-w-0 min-[490px]:flex-1 min-[490px]:items-center min-[490px]:justify-end min-[490px]:gap-3"
    >
      <p
        data-testid="build-progress-message"
        className="ml-auto flex h-6 w-[124px] shrink-0 items-center justify-end text-body-small whitespace-nowrap text-primary min-[304px]:w-36 min-[304px]:text-body-normal min-[490px]:ml-0"
      >
        {isReady ? 'Ready to create hints!' : 'Keep building.'}
      </p>
      <div className="flex h-4 min-w-0 basis-full items-center justify-end gap-2 min-[490px]:basis-auto">
        <div
          data-testid="build-progress-bar"
          role="progressbar"
          aria-label="Grid completion"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-3 w-45 min-w-0 border border-line-muted bg-progress-track"
        >
          <div
            data-testid="build-progress-fill"
            className={`absolute inset-y-0 left-0 ${isReady ? 'bg-progress-fill-ready' : 'bg-progress-fill'}`}
            style={{ width: `${share}%` }}
          />
          <div data-testid="build-progress-zone" className="absolute inset-y-0 left-[80%] w-[5%] bg-progress-zone" />
        </div>
        <p
          data-testid="build-progress-percent"
          className="w-22 shrink-0 text-body-small whitespace-nowrap text-muted"
        >
          {percent}% complete
        </p>
      </div>
    </div>
  );
}
