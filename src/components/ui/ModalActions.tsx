'use client';

import { Button } from './Button';

export function ModalActions({
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="quiet" data-testid="modal-cancel" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button data-testid="modal-confirm" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
}
