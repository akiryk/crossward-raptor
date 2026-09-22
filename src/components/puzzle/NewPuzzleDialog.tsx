'use client';

import { useRef, useState } from 'react';
import { DEFAULT_SIZE, type PuzzleSize } from '../../lib/puzzle-size';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';
import { TextInput } from '../ui/TextInput';

const SIZES: { id: PuzzleSize; label: string }[] = [
  { id: 'mini', label: 'Mini (5×5)' },
  { id: 'midi', label: 'Midi (9×9)' },
  { id: 'daily', label: 'Daily (15×15)' },
  { id: 'sunday', label: 'Sunday (21×21)' },
];

export function NewPuzzleDialog({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: { title: string; size: PuzzleSize }) => void;
}) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<PuzzleSize>(DEFAULT_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref, not just the state above: two clicks dispatched in the same
  // task (a real double-click, or a race in a test) both run before
  // React commits the state update that disables the button, so the
  // guard that actually prevents a second onCreate call has to be a
  // synchronous mutation, not something that waits for a re-render.
  const hasSubmittedRef = useRef(false);

  const canCreate = title.trim() !== '' && !isSubmitting;

  function handleCreate() {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    onCreate({ title, size });
  }

  return (
    <Modal
      open
      title="New puzzle"
      onClose={onCancel}
      testId="new-puzzle-dialog"
      footer={
        <ModalActions
          confirmLabel="Create"
          cancelLabel="Cancel"
          onConfirm={handleCreate}
          onCancel={onCancel}
          confirmDisabled={!canCreate}
          confirmTestId="new-puzzle-create"
          cancelTestId="new-puzzle-cancel"
        />
      }
    >
      <div data-modal-initial-focus className="flex flex-col gap-1">
        <span className="text-label text-ink-2">Puzzle name</span>
        <TextInput
          data-testid="new-puzzle-name"
          aria-label="Puzzle name"
          placeholder="e.g. Monday Puzzle"
          value={title}
          onChange={setTitle}
          autoFocus
        />
      </div>
      <div
        data-testid="new-puzzle-size"
        role="radiogroup"
        aria-label="Puzzle size"
        className="flex flex-col gap-2"
      >
        {SIZES.map(({ id, label }) => (
          <label key={id} className="flex items-center gap-2 text-label">
            <input
              type="radio"
              name="new-puzzle-size"
              data-size={id}
              data-selected={size === id ? 'true' : 'false'}
              checked={size === id}
              onChange={() => setSize(id)}
            />
            {label}
          </label>
        ))}
      </div>
    </Modal>
  );
}
