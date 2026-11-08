'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

// The app's one tooltip (20-S2, 22-S4): a small dark bubble above its
// target and centered on it. It stays 8px inside the window's sides, and
// goes below the target when there's no room above. It takes no pointer
// events or focus.
//
// It alone decides when it shows (22-S4). A caller says what to show and
// over which element the mouse is (`anchor`), or nothing; the bubble then
// appears 500ms after the target was set, or at once while any tooltip
// shows or within 300ms of one hiding (the skip delay, one for the whole
// app). Setting another target before it shows restarts the delay; while
// it shows, a new target moves it and new text updates it in place. It
// hides at once when the target or the text goes.

/** Mouse hover over a target before its tooltip shows. */
const TOOLTIP_DELAY_MS = 500;
/** After a tooltip hides, the next target this soon shows at once. */
const TOOLTIP_SKIP_MS = 300;
/** Between the target and the bubble. */
const GAP = 4;
/** Between the bubble and the window's edges. */
const EDGE = 8;

// The skip delay's state, shared by every Tooltip.
let shownCount = 0;
let lastHiddenAt = -Infinity;

function isSkipping() {
  return shownCount > 0 || performance.now() - lastHiddenAt < TOOLTIP_SKIP_MS;
}

/** The element a plain target's tooltip points at: itself while the
 *  mouse is on it (a touch or pen sets none), for `Tooltip`'s `anchor`. */
export function useTooltipTarget<T extends HTMLElement>() {
  const [target, setTarget] = useState<T | null>(null);
  const onPointerEnter = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType === 'mouse') setTarget(e.currentTarget);
  }, []);
  const onPointerLeave = useCallback(() => setTarget(null), []);
  return { target, handlers: { onPointerEnter, onPointerLeave } };
}

export function Tooltip({
  anchor,
  children,
  testId,
}: {
  /** The element the mouse is on, that it points at; none while closed. */
  anchor: HTMLElement | null;
  children: ReactNode;
  testId?: string;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasText = children !== null && children !== undefined && children !== false && children !== '';
  const target = hasText ? anchor : null;

  // Whether the delay has passed (or was skipped) for the current target;
  // reset at once when the target goes.
  const [isShown, setIsShown] = useState(false);
  if (!target && isShown) setIsShown(false);
  const shownOver = isShown ? target : null;
  const isVisible = shownOver !== null;

  // A new target: shown at once under the skip delay, otherwise after the
  // delay. A shown tooltip just moves.
  useLayoutEffect(() => {
    if (!target || isShown) return;
    if (isSkipping()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the skip delay shows it before paint
      setIsShown(true);
      return;
    }
    const timer = setTimeout(() => {
      if (target.isConnected) setIsShown(true);
    }, TOOLTIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [target, isShown]);

  // Counted while it shows; its hide opens the skip window.
  useLayoutEffect(() => {
    if (!isVisible) return;
    shownCount += 1;
    return () => {
      shownCount -= 1;
      lastHiddenAt = performance.now();
    };
  }, [isVisible]);

  // Placed on the element directly, before paint: its own size decides
  // where it goes.
  const place = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!shownOver || !bubble) return;
    const rect = shownOver.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = bubble;
    const above = rect.top - GAP - height;
    const top = above < EDGE ? rect.bottom + GAP : above;
    const centered = rect.left + rect.width / 2 - width / 2;
    const windowWidth = document.documentElement.clientWidth;
    const left = Math.max(EDGE, Math.min(centered, windowWidth - EDGE - width));
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
    bubble.style.visibility = 'visible';
  }, [shownOver]);

  useLayoutEffect(() => {
    if (!shownOver) return;
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [shownOver, place, children]);

  if (!shownOver || typeof document === 'undefined') return null;

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
