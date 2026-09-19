'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div data-testid="modal" role="dialog" className="fixed inset-0 z-50">
      <div
        data-testid="modal-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/50"
      />
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4">
        <div className="pointer-events-auto relative max-w-md rounded-md border border-rule-strong bg-background p-6">
          <button
            type="button"
            data-testid="modal-close"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3 right-3 cursor-pointer text-ink-2 hover:text-foreground"
          >
            ✕
          </button>
          <h2
            data-testid="modal-title"
            className="font-display text-headline [font-weight:var(--weight-bold)]"
          >
            {title}
          </h2>
          <div className="text-body text-ink-2 mt-3 space-y-3">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}
