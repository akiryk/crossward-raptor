'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';

export function ClearLettersButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div data-testid="clear-letters-confirmation">
        <p>This cannot be undone.</p>
        <Button
          variant="danger"
          data-testid="clear-letters-confirm-button"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
        >
          Clear all letters
        </Button>
        <Button
          variant="quiet"
          data-testid="clear-letters-cancel-button"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="quiet" data-testid="clear-letters-button" onClick={() => setConfirming(true)}>
      Clear all letters
    </Button>
  );
}
