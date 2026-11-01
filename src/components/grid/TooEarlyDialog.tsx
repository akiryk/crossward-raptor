'use client';

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/** Stories 14-S4 and 17-S8. "Not quite!": 3 Publish while a required hint
 *  is blank. The build phase has no Publish, so no other dialog is left. */
export function TooEarlyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      title="Not quite!"
      onClose={onClose}
      testId="too-early-dialog"
      footer={
        <Button data-testid="modal-ok" onClick={onClose}>
          OK
        </Button>
      }
    >
      <p>Some of the puzzle&apos;s words still need hints.</p>
    </Modal>
  );
}
