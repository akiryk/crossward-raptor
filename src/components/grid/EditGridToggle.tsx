'use client';

import { Button } from '../ui/Button';

export function EditGridToggle({
  isEditingGrid,
  disabled,
  onToggle,
}: {
  isEditingGrid: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="quiet"
      data-testid="edit-grid-toggle"
      disabled={disabled}
      onClick={onToggle}
    >
      {isEditingGrid ? 'Edit hints' : 'Edit grid'}
    </Button>
  );
}
