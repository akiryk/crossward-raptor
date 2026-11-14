'use client';

/** What the save status shows (24-S3): edits not yet acknowledged, all
 *  acknowledged, or a send that failed and will be tried again. */
export type SaveStatusState = 'saving' | 'saved' | 'retrying';

const LABELS: Record<SaveStatusState, string> = {
  saving: 'Saving…',
  saved: 'Saved',
  retrying: 'Not saved — retrying',
};

/** Story 24-S3. A quiet line at the end of the step row: the label size,
 *  `subtle`, and `error` while retrying. Empty until the first edit, but
 *  always in place, so nothing moves when it appears. */
export function SaveStatus({ state }: { state: SaveStatusState | null }) {
  return (
    <p
      data-testid="save-status"
      data-state={state ?? 'none'}
      role="status"
      aria-live="polite"
      // 24-S11: an invisible, zero-height "Saving…" reserves the usual
      // labels' width, so the first status can't wrap the owner's link.
      className={`ml-auto min-h-4 shrink-0 text-label before:invisible before:block before:h-0 before:content-['Saving…'] ${state === 'retrying' ? 'text-error' : 'text-subtle'}`}
    >
      {state ? LABELS[state] : ''}
    </p>
  );
}
