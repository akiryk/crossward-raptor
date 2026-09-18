'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div data-testid="modal" role="dialog" className="fixed inset-0 z-50">
      <div
        data-testid="modal-backdrop"
        onClick={onCancel}
        className="absolute inset-0 bg-foreground/50"
      />
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4">
        <div className="pointer-events-auto max-w-md rounded-md border border-rule-strong bg-background p-6">
          <h2
            data-testid="modal-title"
            className="font-display text-headline [font-weight:var(--weight-bold)]"
          >
            {title}
          </h2>
          <div className="text-body text-ink-2 mt-3 space-y-3">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="quiet" data-testid="modal-cancel" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button data-testid="modal-confirm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
