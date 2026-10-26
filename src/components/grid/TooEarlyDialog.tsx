'use client';

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export type TooEarlyKind = 'lol' | 'nope' | 'not-quite';

const COPY: Record<TooEarlyKind, { title: string; body: string }> = {
  lol: {
    title: 'Lol.',
    body: "I think you know you can't publish until you actually complete the puzzle. Carry on.",
  },
  nope: { title: 'Nope.', body: 'Sorry.' },
  'not-quite': { title: 'Not quite!', body: "Some of the puzzle's words still need hints." },
};

/** Story 14-S4. Why 3 Publish can't publish yet. */
export function TooEarlyDialog({ kind, onClose }: { kind: TooEarlyKind | null; onClose: () => void }) {
  const copy = kind ? COPY[kind] : COPY.lol;
  return (
    <Modal
      open={kind !== null}
      title={copy.title}
      onClose={onClose}
      testId="too-early-dialog"
      footer={
        <Button data-testid="modal-ok" onClick={onClose}>
          OK
        </Button>
      }
    >
      <p>{copy.body}</p>
    </Modal>
  );
}
