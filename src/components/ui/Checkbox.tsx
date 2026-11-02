'use client';

import type { ReactNode } from 'react';

/** Story 18-S4: a native checkbox drawn as a 16px square with 4px corners,
 *  a 1px `button-alternate-border` outline, filled with the button blue and
 *  a white check when checked. Its label carries the app's focus ring. */
export function Checkbox({
  label,
  checked,
  onChange,
  name,
  value,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  value?: string;
}) {
  return (
    <label data-checkbox className="inline-flex cursor-pointer items-center gap-2 select-none">
      <span className="relative inline-flex size-4 shrink-0">
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="peer size-4 cursor-pointer appearance-none rounded-[4px] border border-button-alternate-border bg-transparent outline-none transition-colors duration-150 ease-out checked:border-button-fill checked:bg-button-fill"
        />
        <svg
          data-checkbox-check
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 hidden size-4 text-inverse peer-checked:block"
        >
          <path d="M4 8.5 7 11.5 12 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span data-checkbox-label className="text-body-normal text-primary">{label}</span>
    </label>
  );
}
