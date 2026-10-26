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
    <Modal
      open={open}
      title="You sure?"
      onClose={onCancel}
      testId="enter-hints-dialog"
      footer={
        <ModalActions
          confirmLabel="Yes, create hints"
          cancelLabel="Keep building"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      }
    >
      <p>
        Creating hints will lock the black and white cells as they are now.
      </p>
    </Modal>
  );
}
