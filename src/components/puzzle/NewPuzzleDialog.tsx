'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SIZE, type PuzzleSize } from '../../lib/puzzle-size';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';

const SIZES: { id: PuzzleSize; label: string }[] = [
  { id: 'mini', label: 'Mini (5×5)' },
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const canCreate = title.trim() !== '';

  return (
    <div data-testid="new-puzzle-dialog" role="dialog">
      <TextInput
        data-testid="new-puzzle-name"
        aria-label="Puzzle name"
        value={title}
        onChange={setTitle}
        autoFocus
      />
      <div data-testid="new-puzzle-size">
        {SIZES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            data-size={id}
            data-selected={size === id ? 'true' : 'false'}
            onClick={() => setSize(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Button
        data-testid="new-puzzle-create"
        disabled={!canCreate}
        onClick={() => onCreate({ title, size })}
      >
        Create
      </Button>
      <Button variant="quiet" data-testid="new-puzzle-cancel" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
