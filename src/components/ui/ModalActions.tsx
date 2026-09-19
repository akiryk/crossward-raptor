'use client';

import { Button } from './Button';

export function ModalActions({
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmTestId = 'modal-confirm',
  cancelTestId = 'modal-cancel',
}: {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  confirmTestId?: string;
  cancelTestId?: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="quiet" data-testid={cancelTestId} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button data-testid={confirmTestId} onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </Button>
    </div>
  );
}
