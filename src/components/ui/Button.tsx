'use client';

import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'quiet' | 'danger';

const VARIANT_BASE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white',
  quiet: 'border border-rule-strong bg-background text-accent',
  danger: 'bg-required text-white',
};

// No --color-required-hover token exists (D1b: no new tokens beyond
// what's declared), so danger's hover is a brightness filter rather than
// a color swap -- still a real, testable change, no new token needed.
const VARIANT_HOVER: Record<ButtonVariant, string> = {
  primary: 'hover:bg-accent-hover',
  quiet: 'hover:bg-hover-tint',
  danger: 'hover:brightness-90',
};

export function Button({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
  'data-testid': dataTestId,
}: {
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  'data-testid'?: string;
}) {
  return (
    <button
      type="button"
      data-testid={dataTestId}
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-btn px-4 py-2',
        VARIANT_BASE[variant],
        // Disabled buttons get no hover response at all (D1/D1b) -- the
        // hover classes are omitted entirely, not just visually
        // suppressed, since :hover still matches a disabled element.
        disabled ? 'cursor-not-allowed opacity-50' : `cursor-pointer ${VARIANT_HOVER[variant]}`,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
