'use client';

import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';

export function EnterHintsDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {open && (
        <div data-testid="enter-hints-dialog" className="fixed inset-0 z-50">
          <Modal
            open={open}
            title="Ready to write clues?"
            onClose={onCancel}
            footer={
              <ModalActions
                confirmLabel="Write clues"
                cancelLabel="Keep building"
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            }
          >
            <p>
              Writing clues locks your grid. Every empty square becomes a
              black square, and the black-and-white pattern is fixed from
              then on — you won&rsquo;t be able to add or remove black
              squares, or change how long any word is.
            </p>
            <p>You&rsquo;ll still be able to change letters afterward.</p>
            <p>
              If you haven&rsquo;t already, preview your grid first to see
              how it will look.
            </p>
          </Modal>
        </div>
      )}
    </>
  );
}
