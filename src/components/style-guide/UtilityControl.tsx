'use client';

import { useEffect, useRef } from 'react';

function rangeFor(token: string): { min: number; max: number; step: number } {
  if (token === '--grid-line-width') {
    return { min: 0, max: 8, step: 0.5 };
  }
  return { min: 0, max: 64, step: 0.5 };
}

/**
 * Pairs a range input with an editable number for a pixel-valued token
 * (radii, grid-line-width). The number is authoritative; the range is a
 * convenience bounded at a sensible span, clamped silently for a
 * committed value outside it -- --radius-btn's 999px pill has no usable
 * slider range that could reach it without making the slider useless
 * for every other token. Uncontrolled, same pattern as ColorPicker/
 * SizeControl/WeightControl.
 */
export function UtilityControl({ token }: { token: string }) {
  const rangeRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const { min, max, step } = rangeFor(token);

  useEffect(() => {
    const rangeEl = rangeRef.current;
    const numberEl = numberRef.current;
    if (!rangeEl || !numberEl) return;

    function clamp(value: number) {
      return Math.min(Math.max(value, min), max);
    }

    function setValue(next: number) {
      numberEl!.value = String(next);
      rangeEl!.value = String(clamp(next));
      document.documentElement.style.setProperty(token, `${next}px`);
    }

    const committed =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token)) || 0;
    numberEl.value = String(committed);
    rangeEl.value = String(clamp(committed));

    function handleRangeInput() {
      setValue(parseFloat(rangeEl!.value));
    }

    function handleNumberInput() {
      const next = parseFloat(numberEl!.value);
      if (!Number.isNaN(next)) setValue(next);
    }

    rangeEl.addEventListener('input', handleRangeInput);
    numberEl.addEventListener('input', handleNumberInput);
    return () => {
      rangeEl.removeEventListener('input', handleRangeInput);
      numberEl.removeEventListener('input', handleNumberInput);
    };
  }, [token, min, max]);

  return (
    <div
      data-testid="utility-control"
      data-token-name={token}
      className="flex items-center gap-3 border-b border-rule py-2"
    >
      <input
        ref={rangeRef}
        data-testid="utility-range"
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={min}
        className="cursor-pointer"
      />
      <input
        ref={numberRef}
        data-testid="utility-number"
        type="number"
        step={step}
        defaultValue={0}
        className="w-16 rounded-md border border-rule-strong bg-background px-2 py-1 text-label"
      />
      <span className="font-data text-label text-ink-2">{token}</span>
    </div>
  );
}
