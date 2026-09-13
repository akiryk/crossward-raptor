'use client';

import { useEffect, useRef } from 'react';

/**
 * Writes directly to document.documentElement.style, which overrides the
 * @theme value for the whole document -- every element referencing the
 * token updates at once. Nothing is persisted; a reload always shows the
 * committed value from globals.css.
 *
 * The input is deliberately uncontrolled (a ref, not a value/onChange
 * pair) with a plain addEventListener rather than React's onChange.
 * React tracks a controlled input's last-seen value internally to decide
 * whether to fire onChange; a caller that sets `.value` directly and then
 * dispatches a native event (as opposed to a real user keystroke/drag)
 * updates that internal tracker at the same time it sets the value, so
 * React sees no change and never calls the handler. A native listener has
 * no such tracker and always fires on a real dispatched event.
 */
export function ColorPicker({ token }: { token: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();

    function handleInput() {
      document.documentElement.style.setProperty(token, input!.value);
    }

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [token]);

  return (
    <div
      data-testid="color-picker"
      data-token-name={token}
      className="flex items-center gap-3 border-b border-rule py-2"
    >
      <input
        ref={inputRef}
        data-testid="color-input"
        type="color"
        defaultValue="#000000"
        className="h-8 w-8 cursor-pointer rounded-md border border-rule-strong"
      />
      <span className="font-data text-sm text-ink-2">{token}</span>
    </div>
  );
}
