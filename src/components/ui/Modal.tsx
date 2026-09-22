'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  testId,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // What to restore focus to on close. Seeded from the hook's own initial
  // value (not read/written in the render body -- refs may only be
  // touched in effects/handlers), which is correct for a fresh instance
  // that mounts already open (NewPuzzleDialog, remounted each time it
  // opens), since that expression runs during render, before commit. The
  // effect below covers the other shape: EnterHintsDialog keeps one
  // Modal instance mounted and only toggles `open`, so a later reopen
  // needs a fresh capture too.
  const previouslyFocusedRef = useRef<Element | null>(
    typeof document !== 'undefined' ? document.activeElement : null
  );
  const isMountRef = useRef(true);

  // Re-capture on a reopen of an already-mounted instance, skipping the
  // render where this component itself just mounted -- that case is
  // already covered by previouslyFocusedRef's initial value, and an
  // effect is accurate for a reopen since nothing shifts focus before it
  // runs for the consumer that reuses one instance.
  useEffect(() => {
    const isMount = isMountRef.current;
    isMountRef.current = false;
    if (!open || isMount) return;
    previouslyFocusedRef.current = document.activeElement;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = focusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const delta = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + delta + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[nextIndex]!.focus();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Initial focus: a child opts in with data-modal-initial-focus on an
  // ancestor of its intended target; otherwise focus the panel itself so
  // a screen reader reads the title and body before a keyboard user tabs
  // into a control. Deliberately not "focus whatever a child's own
  // autoFocus already targeted" -- in dev, React's Strict Mode runs a
  // fresh mount's effects twice (mount, simulated unmount, mount again)
  // to surface exactly this kind of bug, and the scroll-lock effect
  // below restores focus to the opener during that simulated unmount's
  // cleanup. Reading "what currently has focus" is only reliable for the
  // very first of those passes; explicitly re-focusing our own known
  // target on every pass is reentrant regardless of how many times
  // Strict Mode replays it.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const marked = panel.querySelector('[data-modal-initial-focus]');
    const target =
      marked?.querySelector<HTMLElement>('a[href], button, input, select, textarea, [tabindex]') ??
      null;
    (target ?? panel).focus();
  }, [open]);

  // Scroll lock, restoring the exact previous value rather than assuming
  // a default -- and focus restore, tolerating a vanished target (e.g.
  // creating a puzzle navigates away and unmounts the button that opened
  // this dialog).
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = previouslyFocusedRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div data-testid="modal" className="fixed inset-0 z-50">
      <div
        data-testid="modal-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/50"
      />
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          data-testid={testId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="pointer-events-auto relative max-w-md rounded-md border border-rule-strong bg-background p-6 outline-none"
        >
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
            id={titleId}
            data-testid="modal-title"
            className="font-display text-headline [font-weight:var(--weight-bold)]"
          >
            {title}
          </h2>
          <div className="text-body text-ink-2 mt-3 space-y-3">{children}</div>
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}
