'use client';

/** One refused edit (24-S3): what wasn't saved and why, and the refused
 *  input, if any, to copy. */
export interface SaveNotice {
  readonly id: string;
  readonly message: string;
  readonly input: string | null;
}

/** Story 24-S3. Refused edits, explained without interrupting: each a note
 *  on the toggle row's panel color, between the controls and the grid
 *  (where the session panel will sit, epic 24 S7). The refused input stays
 *  in a read-only field, selected on focus, with Copy, until dismissed. */
export function SaveNotices({
  notices,
  onDismiss,
}: {
  notices: readonly SaveNotice[];
  onDismiss: (id: string) => void;
}) {
  if (notices.length === 0) return null;
  return (
    <div data-testid="save-notices" className="mb-4 flex flex-col gap-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          data-testid="save-notice"
          role="alert"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-modal bg-toggle-row px-4 py-3"
        >
          <p data-testid="save-notice-message" className="min-w-0 flex-1 basis-60 text-body-normal text-primary">
            {notice.message}
          </p>
          {notice.input !== null && (
            <input
              data-testid="save-notice-input"
              aria-label="Your unsaved input"
              readOnly
              value={notice.input}
              onFocus={(event) => event.currentTarget.select()}
              className="w-40 min-w-0 border-0 border-b border-line-muted bg-transparent py-1 text-body-normal text-primary outline-none focus:border-line-highlight"
            />
          )}
          <div className="flex items-center gap-5">
            {notice.input !== null && (
              <button
                type="button"
                data-testid="save-notice-copy"
                onClick={() => void navigator.clipboard?.writeText(notice.input ?? '').catch(() => undefined)}
                className="cursor-pointer text-label text-subtle outline-hidden transition-colors duration-150 ease-out hover:text-primary focus-visible:text-primary"
              >
                Copy
              </button>
            )}
            <button
              type="button"
              data-testid="save-notice-dismiss"
              onClick={() => onDismiss(notice.id)}
              className="cursor-pointer text-label text-subtle outline-hidden transition-colors duration-150 ease-out hover:text-primary focus-visible:text-primary"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
