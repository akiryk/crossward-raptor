'use client';

import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// The app's one tooltip (20-S2): a small dark bubble above its anchor and
// centered on it, shown at once. It stays 8px inside the window's sides,
// and goes below the anchor when there's no room above. It takes no
// pointer events or focus; when and over what it shows is the caller's.

/** Between the anchor and the bubble. */
const GAP = 4;
/** Between the bubble and the window's edges. */
const EDGE = 8;

export function Tooltip({
  anchor,
  children,
  testId,
}: {
  /** The element it points at; none while closed. */
  anchor: HTMLElement | null;
  children: ReactNode;
  testId?: string;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Placed on the element directly, before paint: its own size decides
  // where it goes.
  const place = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!anchor || !bubble) return;
    const rect = anchor.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = bubble;
    const above = rect.top - GAP - height;
    const top = above < EDGE ? rect.bottom + GAP : above;
    const centered = rect.left + rect.width / 2 - width / 2;
    const windowWidth = document.documentElement.clientWidth;
    const left = Math.max(EDGE, Math.min(centered, windowWidth - EDGE - width));
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
    bubble.style.visibility = 'visible';
  }, [anchor]);

  useLayoutEffect(() => {
    if (!anchor) return;
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchor, place, children]);

  if (!anchor || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={bubbleRef}
      data-testid={testId}
      role="tooltip"
      className="pointer-events-none fixed z-50 w-max max-w-[280px] rounded bg-preview-cell-off px-2 py-1 text-center text-label text-inverse"
      style={{ top: 0, left: 0, visibility: 'hidden' }}
    >
      {children}
    </div>,
    document.body
  );
}
