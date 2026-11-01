'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/** The library's Reset confirmation (17-S3: play has no Reset). */
export function PlayResetDialog({
  open,
  pending,
  failed,
  onConfirm,
  onCancel,
  puzzleTitle,
}: {
  open: boolean;
  pending: boolean;
  failed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Names the puzzle where several could be reset, as in the library. */
  puzzleTitle?: string;
}) {
  return (
    <Modal
      open={open}
      title="Reset puzzle?"
      testId="play-reset-dialog"
      onClose={onCancel}
      dismissalDisabled={pending}
      footer={(
        <>
          <Button data-testid="play-reset-confirm" onClick={onConfirm} disabled={pending}>
            Reset puzzle
          </Button>
          <Button variant="alternate" data-testid="play-reset-cancel" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </>
      )}
    >
      {puzzleTitle === undefined ? (
        <p>
          This clears your entries and your completion record, and starts the puzzle over.
          It cannot be undone.
        </p>
      ) : (
        <p>
          This clears your entries and your completion record for{' '}
          <span className="font-semibold text-primary">{puzzleTitle}</span>,
          and starts the puzzle over. It cannot be undone.
        </p>
      )}
      {pending && <p data-testid="play-reset-pending" role="status">Resetting your puzzle…</p>}
      {failed && !pending && (
        <p data-testid="play-reset-error" role="alert" className="text-error">
          We couldn’t reset your puzzle. Please try again.
        </p>
      )}
    </Modal>
  );
}
