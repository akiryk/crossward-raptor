'use client';

/** What the save status shows (24-S3): edits not yet acknowledged, all
 *  acknowledged, or a send that failed and will be tried again. */
export type SaveStatusState = 'saving' | 'saved' | 'retrying';

const LABELS: Record<SaveStatusState, string> = {
  saving: 'Saving…',
  saved: '',
  retrying: 'Not saved — retrying',
};

/** Transient save feedback at the end of the step row. The idle hook
 *  retains acknowledgement state without text or reserved layout space (17-S12). */
export function SaveStatus({ state }: { state: SaveStatusState | null }) {
  return (
    <p
      data-testid="save-status"
      data-state={state ?? 'none'}
      role="status"
      aria-live="polite"
      className={`ml-auto shrink-0 text-label ${state === null || state === 'saved' ? 'hidden' : ''} ${state === 'retrying' ? 'text-error' : 'text-subtle'}`}
    >
      {state ? LABELS[state] : ''}
    </p>
  );
}
