'use client';

import { Button } from './Button';

/** A dialog's confirm and cancel buttons, confirm first; Modal's footer
 *  row lays them out. */
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
    <>
      <Button data-testid={confirmTestId} onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </Button>
      <Button variant="alternate" data-testid={cancelTestId} onClick={onCancel}>
        {cancelLabel}
      </Button>
    </>
  );
}
