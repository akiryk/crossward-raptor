'use client';

import { useState } from 'react';

export function ClearLettersButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div data-testid="clear-letters-confirmation">
        <p>This cannot be undone.</p>
        <button
          type="button"
          data-testid="clear-letters-confirm-button"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
        >
          Clear all letters
        </button>
        <button
          type="button"
          data-testid="clear-letters-cancel-button"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button type="button" data-testid="clear-letters-button" onClick={() => setConfirming(true)}>
      Clear all letters
    </button>
  );
}
