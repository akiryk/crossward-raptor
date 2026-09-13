'use client';

import { useEffect, useRef } from 'react';

// Covers every role (0.75rem-1.75rem) with room either side. 0.025, not
// the nominal 0.05, because a native range input snaps a value that
// doesn't land exactly on its step grid to the nearest one it does --
// 0.875rem (--text-help) is 7.5 steps above 0.5 at 0.05, so the browser
// rounded the committed value to 0.9 on load. 0.025 divides all four
// committed values (0.75, 0.875, 1, 1.75) exactly.
const MIN_REM = 0.5;
const MAX_REM = 3;
const STEP_REM = 0.025;

/**
 * A range input for a --text-* size token. Uncontrolled (a ref, not a
 * value/onChange pair) for the same reason ColorPicker's colour input is
 * -- see that component's comment. Writes straight to
 * document.documentElement.style, exactly like ColorPicker.
 */
export function SizeControl({ token }: { token: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    const output = outputRef.current;
    if (!input || !output) return;

    const committed = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const rem = parseFloat(committed) || 1;
    input.value = String(rem);
    output.textContent = `${rem.toFixed(2)}rem`;

    function handleInput() {
      const next = parseFloat(input!.value);
      output!.textContent = `${next.toFixed(2)}rem`;
      document.documentElement.style.setProperty(token, `${next}rem`);
    }

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [token]);

  return (
    <div
      data-testid="size-control"
      data-token-name={token}
      className="flex items-center gap-3 border-b border-rule py-2"
    >
      <input
        ref={inputRef}
        data-testid="size-input"
        type="range"
        min={MIN_REM}
        max={MAX_REM}
        step={STEP_REM}
        defaultValue={1}
        className="cursor-pointer"
      />
      <span ref={outputRef} className="w-14 shrink-0 font-data text-label text-ink-3" />
      <span className="font-data text-label text-ink-2">{token}</span>
    </div>
  );
}
