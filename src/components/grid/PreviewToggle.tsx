'use client';

import { Button } from '../ui/Button';

export function PreviewToggle({
  isPreviewing,
  onToggle,
}: {
  isPreviewing: boolean;
  onToggle: () => void;
}) {
  return (
    <Button variant="quiet" data-testid="preview-toggle" onClick={onToggle}>
      {isPreviewing ? 'Back to build view' : 'Preview'}
    </Button>
  );
}
