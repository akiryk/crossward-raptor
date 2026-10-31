'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface MenuItem {
  key: string;
  label: string;
  testId?: string;
  tone?: 'primary' | 'error';
  /** Sync: the menu closes and focuses its button. Async: the menu stays
   *  open and its items `aria-disabled` until it settles, closing on true. */
  onSelect: () => void | Promise<boolean>;
}

function menuItems(list: HTMLElement | null): HTMLElement[] {
  return Array.from(list?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

/** Story 16-S2: a three-dot button and the menu it opens, following the
 *  WAI-ARIA menu button pattern. `alert` renders under the open menu. While
 *  an item's change is pending, nothing closes the menu. */
export function Menu({ label, items, alert, onOpen, className = '' }: {
  label: string;
  items: MenuItem[];
  alert?: ReactNode;
  onOpen?: () => void;
  className?: string;
}) {
  const buttonId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const initial = useRef<'first' | 'last'>('first');

  useEffect(() => {
    if (!open) return;
    const all = menuItems(list.current);
    (initial.current === 'last' ? all[all.length - 1] : all[0])?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      if (busyRef.current || wrapper.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  function close(focusButton: boolean) {
    if (busyRef.current) return;
    setOpen(false);
    if (focusButton) button.current?.focus();
  }

  function openAt(which: 'first' | 'last') {
    initial.current = which;
    onOpen?.();
    setOpen(true);
  }

  async function choose(item: MenuItem) {
    if (busyRef.current) return;
    const result = item.onSelect();
    if (!(result instanceof Promise)) {
      close(true);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    let done = false;
    try {
      done = await result;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    if (done) close(true);
  }

  // Enter and Space open it through the button's own click.
  function onButtonKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openAt(event.key === 'ArrowDown' ? 'first' : 'last');
  }

  function onMenuKey(event: KeyboardEvent) {
    const all = menuItems(list.current);
    const index = all.indexOf(document.activeElement as HTMLElement);
    const moveTo = (to: number) => {
      event.preventDefault();
      all[(to + all.length) % all.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown': moveTo(index + 1); break;
      case 'ArrowUp': moveTo(index - 1); break;
      case 'Home': moveTo(0); break;
      case 'End': moveTo(all.length - 1); break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab': close(false); break;
    }
  }

  return (
    <div ref={wrapper} className={`${open ? 'z-30' : 'z-20'} ${className}`}>
      <button
        ref={button}
        id={buttonId}
        type="button"
        data-testid="puzzle-menu-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-6 cursor-pointer items-center justify-center text-muted outline-none hover:text-primary focus-visible:text-primary"
        onClick={() => (open ? close(false) : openAt('first'))}
        onKeyDown={onButtonKey}
      >
        <svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true" fill="currentColor">
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="8" cy="2" r="1.5" />
          <circle cx="14" cy="2" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)]">
          <div
            ref={list}
            role="menu"
            aria-labelledby={buttonId}
            data-testid="puzzle-menu"
            onKeyDown={onMenuKey}
            className="flex min-w-[160px] flex-col rounded-modal border border-line-muted bg-modal-background py-1"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                data-testid={item.testId}
                aria-disabled={busy || undefined}
                className={`flex h-8 cursor-pointer items-center whitespace-nowrap px-3 text-left text-body-normal outline-none hover:bg-puzzle-row-hover focus-visible:bg-puzzle-row-hover ${item.tone === 'error' ? 'text-error' : 'text-primary'}`}
                onClick={() => void choose(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {alert}
        </div>
      )}
    </div>
  );
}
