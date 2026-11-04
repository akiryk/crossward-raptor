'use client';

import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';

// The build phase's Start Over (20-S1): a link at the toggle row's right
// end. Like the Rebus link, a click never takes focus from the grid.
export function StartOverLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="start-over"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="shrink-0 cursor-pointer text-label text-subtle outline-hidden transition-colors duration-150 ease-out hover:text-primary focus-visible:text-primary"
    >
      Start Over
    </button>
  );
}

export function StartOverDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Clear Puzzle"
      onClose={onCancel}
      testId="start-over-dialog"
      footer={
        <ModalActions
          confirmLabel="Clear Puzzle"
          cancelLabel="Cancel"
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmTestId="start-over-confirm"
          cancelTestId="start-over-cancel"
        />
      }
    >
      <p>Are you sure? This will remove every letter from the grid.</p>
    </Modal>
  );
}
