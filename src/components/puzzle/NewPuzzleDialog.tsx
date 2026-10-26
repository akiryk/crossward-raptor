'use client';

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { generatePuzzleName } from '../../lib/puzzle-name';
import { DEFAULT_SIZE, type PuzzleSize } from '../../lib/puzzle-size';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';
import { RadioGroup } from '../ui/Radio';
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
  const [title, setTitle] = useState(() => generatePuzzleName());
  const [size, setSize] = useState<PuzzleSize>(DEFAULT_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref, not just the state above: two clicks dispatched in the same
  // task (a real double-click, or a race in a test) both run before
  // React commits the state update that disables the button, so the
  // guard that actually prevents a second onCreate call has to be a
  // synchronous mutation, not something that waits for a re-render.
  const hasSubmittedRef = useRef(false);

  const canCreate = title.trim() !== '' && !isSubmitting;
  const sizeLabelId = useId();

  // The field opens with the caret after the generated name. While the
  // name is untouched, a click in the field selects all of it, so typing
  // replaces it.
  const touchedRef = useRef(false);
  const nameRef = useRef<HTMLDivElement>(null);

  // autoFocus runs before the value is in the field, so place the caret
  // once mounted.
  useEffect(() => {
    const input = nameRef.current?.querySelector('input');
    input?.setSelectionRange(input.value.length, input.value.length);
  }, []);

  function handleNameMouseDown(event: MouseEvent) {
    if (touchedRef.current) return;
    // A click inside a selection collapses it, so keep the browser from
    // placing a caret and focus and select the name by hand.
    event.preventDefault();
    const input = nameRef.current?.querySelector('input');
    input?.focus();
    input?.select();
  }

  function handleCreate() {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    onCreate({ title, size });
  }

  return (
    <Modal
      open
      title="A New Puzzle!"
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
      {/* One child, so the Modal content's sibling spacing doesn't apply. */}
      <div>
        <div ref={nameRef} data-modal-initial-focus onMouseDown={handleNameMouseDown}>
          <TextInput
            data-testid="new-puzzle-name"
            label="Name it!"
            aria-label="Name it!"
            placeholder="Add name here..."
            value={title}
            onChange={(value) => {
              touchedRef.current = true;
              setTitle(value);
            }}
            autoFocus
          />
        </div>
        <p id={sizeLabelId} data-testid="new-puzzle-size-label" className="mt-8 mb-3 text-title-4 text-primary">
          And pick a size!
        </p>
        <RadioGroup
          data-testid="new-puzzle-size"
          name="new-puzzle-size"
          labelledBy={sizeLabelId}
          options={SIZES.map(({ id, label }) => ({
            value: id,
            label,
            attributes: { 'data-size': id, 'data-selected': size === id ? 'true' : 'false' },
          }))}
          value={size}
          onChange={setSize}
        />
      </div>
    </Modal>
  );
}
