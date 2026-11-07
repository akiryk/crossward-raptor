'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';

// The build phase's Reset Grid (20-S1, under the grid since 20-S4). Like
// the Rebus link, a click never takes focus from the grid.
export function StartOverLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="start-over"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="shrink-0 cursor-pointer text-label text-subtle outline-hidden transition-colors duration-150 ease-out hover:text-primary focus-visible:text-primary"
    >
      Reset Grid
    </button>
  );
}

// With a locked word the dialog asks whether to keep locked words (21-S6):
// three buttons, on one line when they all fit, otherwise one per line,
// left-aligned. Without one it's 20-S1's dialog, unchanged.
export function StartOverDialog({
  open,
  hasLockedWords,
  onClearAll,
  onKeepLocked,
  onCancel,
}: {
  open: boolean;
  hasLockedWords: boolean;
  onClearAll: () => void;
  onKeepLocked: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Reset Grid"
      onClose={onCancel}
      testId="start-over-dialog"
      footer={
        hasLockedWords ? (
          <LockedWordsActions onClearAll={onClearAll} onKeepLocked={onKeepLocked} onCancel={onCancel} />
        ) : (
          <ModalActions
            confirmLabel="Reset Grid"
            cancelLabel="Cancel"
            onConfirm={onClearAll}
            onCancel={onCancel}
            confirmTestId="start-over-confirm"
            cancelTestId="start-over-cancel"
          />
        )
      }
    >
      <p>
        {hasLockedWords
          ? 'Do you want locked words to remain or would you rather clear every cell?'
          : 'Are you sure? This will remove every letter from the grid.'}
      </p>
    </Modal>
  );
}

// ModalActions holds two buttons; these three stack whenever their row
// would be wider than the footer, measured again as either's size changes.
function LockedWordsActions({
  onClearAll,
  onKeepLocked,
  onCancel,
}: {
  onClearAll: () => void;
  onKeepLocked: () => void;
  onCancel: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isStacked, setIsStacked] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const buttons = [...row.children] as HTMLElement[];
    const measure = () => {
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const width = buttons.reduce((sum, button) => sum + button.offsetWidth, 0) + gap * (buttons.length - 1);
      setIsStacked(width > row.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    buttons.forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rowRef} className={`flex w-full gap-3 ${isStacked ? 'flex-col items-start' : ''}`}>
      <Button data-testid="start-over-clear-all" onClick={onClearAll}>
        Clear Every Cell
      </Button>
      <Button variant="alternate" data-testid="start-over-keep-locked" onClick={onKeepLocked}>
        Keep Locked Words
      </Button>
      <Button variant="alternate" data-testid="start-over-cancel" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
