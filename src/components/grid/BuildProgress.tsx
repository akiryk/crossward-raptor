import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Grid } from '../../engine/grid';
import { READY_PERCENT, completionCount, completionPercent, isReadyForHints } from '../../engine/completion';

/** Story 22-S3: the fill's width moves to a new value over this long. */
const FILL_ANIMATION_MS = 700;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Story 22-S3. The fill's drawn share (percent of the bar's inside): from
 *  0 on mount, and from wherever it is on each later change, it moves to
 *  `share` over 700ms with an ease-out cubic, its last frame setting
 *  `share` itself. The effect starts from a ref of the drawn share and its
 *  cleanup cancels the pending frame, so a Strict Mode remount or a change
 *  mid-animation continues from where the fill is. Under reduced motion the
 *  drawn share is `share`, in the same render as the texts. */
function useDrawnShare(share: number): number {
  const reduceMotion = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);
  const drawnRef = useRef(0);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      drawnRef.current = share;
      return;
    }
    const from = drawnRef.current;
    let start: number | null = null;
    let frame = 0;
    const step = (now: number) => {
      start ??= now;
      const t = from === share ? 1 : Math.min(1, (now - start) / FILL_ANIMATION_MS);
      const value = t >= 1 ? share : from + (share - from) * (1 - (1 - t) ** 3);
      drawnRef.current = value;
      setAnimated(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [share, reduceMotion]);

  return reduceMotion ? share : animated;
}

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
 *  `body-small` in a 124px box.
 *
 *  Story 22-S3: the bar is 16px tall with 20px corners, the fill and zone
 *  clipped to its rounded inside. The fill's width animates (see
 *  `useDrawnShare`) and its color follows the drawn width, ready from 80%
 *  of the inside; the texts change at once. */
export function BuildProgress({ grid }: { grid: Grid }) {
  const count = completionCount(grid);
  const percent = completionPercent(count);
  const isReady = isReadyForHints(count);
  const share = count.total === 0 ? 0 : (100 * count.lettered) / count.total;
  const drawn = useDrawnShare(share);
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
          className="relative h-4 w-45 min-w-0 overflow-hidden rounded-[20px] border border-line-muted bg-progress-track"
        >
          <div
            data-testid="build-progress-fill"
            className={`absolute inset-y-0 left-0 transition-colors duration-150 motion-reduce:transition-none ${drawn >= READY_PERCENT ? 'bg-progress-fill-ready' : 'bg-progress-fill'}`}
            style={{ width: `${drawn}%` }}
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
