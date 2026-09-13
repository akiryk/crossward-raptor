'use client';

import { useEffect, useRef } from 'react';

const WEIGHTS = [
  { value: '400', label: 'Normal (400)' },
  { value: '700', label: 'Bold (700)' },
];

/**
 * A weight selector for a --weight-* token. Uncontrolled, same reasoning
 * as ColorPicker/SizeControl. Writes straight to
 * document.documentElement.style.
 */
export function WeightControl({ token }: { token: string }) {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    select.value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();

    function handleChange() {
      document.documentElement.style.setProperty(token, select!.value);
    }

    select.addEventListener('change', handleChange);
    return () => select.removeEventListener('change', handleChange);
  }, [token]);

  return (
    <div
      data-testid="weight-control"
      data-token-name={token}
      className="flex items-center gap-3 border-b border-rule py-2"
    >
      <select
        ref={selectRef}
        data-testid="weight-input"
        defaultValue="400"
        className="cursor-pointer rounded-md border border-rule-strong bg-background px-2 py-1"
      >
        {WEIGHTS.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>
      <span className="font-data text-label text-ink-2">{token}</span>
    </div>
  );
}
