'use client';

import type { FocusEvent as ReactFocusEvent, Ref } from 'react';

// Story 21-S5. Lock Word in the toggle row, while the grid is narrower than
// its full width: a text button in Rebus's style, enabled at once in a
// lockable or locked word, muted gray otherwise. A click or tap never takes
// focus from the grid; focused by keyboard, it counts as the grid's focus.
export function LockWordControl({
  isLocked,
  disabled,
  hidden,
  buttonRef,
  onClick,
  onFocus,
  onBlur,
}: {
  isLocked: boolean;
  disabled: boolean;
  /** Preview on: kept in place but not shown. */
  hidden: boolean;
  buttonRef: Ref<HTMLButtonElement>;
  onClick: () => void;
  onFocus: () => void;
  onBlur: (event: ReactFocusEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      data-testid="lock-word-control"
      // aria-disabled, not disabled: it stays a Tab stop while focus passes
      // through Rebus (no word selected), and is enabled once focused.
      aria-disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`shrink-0 cursor-pointer whitespace-nowrap text-label outline-hidden focus-visible:underline aria-disabled:cursor-not-allowed ${
        disabled ? 'text-subtle' : 'text-link-muted hover:text-button-hover'
      } ${hidden ? 'invisible' : ''}`}
    >
      {isLocked ? 'Unlock Word' : 'Lock Word'}
    </button>
  );
}
