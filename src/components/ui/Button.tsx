'use client';

import type { ReactNode } from 'react';

export type ButtonVariant = 'normal' | 'alternate';
export type ButtonSize = 'normal' | 'large';

// Story F3. Each type's look per state. Hover's look also shows on keyboard
// focus (focus-visible); the selected look shows while selected or pressed.
const FILLED = {
  base: 'border-button-fill bg-button-fill text-inverse',
  hover: 'hover:border-button-hover hover:bg-button-hover focus-visible:border-button-hover focus-visible:bg-button-hover',
  pressed: 'active:border-button-active active:bg-button-active',
  selected: 'border-button-active bg-button-active text-inverse',
};

// Alternate has one active look for hover, keyboard focus, selected and
// pressed.
const ALTERNATE_ACTIVE = 'border-line-dark bg-button-alternate-hover text-inverse';
const ALTERNATE = {
  base: 'border-button-alternate-border bg-fill-muted text-subtle',
  hover:
    'hover:border-line-dark hover:bg-button-alternate-hover hover:text-inverse ' +
    'focus-visible:border-line-dark focus-visible:bg-button-alternate-hover focus-visible:text-inverse',
  pressed: 'active:border-line-dark active:bg-button-alternate-hover active:text-inverse',
  selected: ALTERNATE_ACTIVE,
};

// The number's color follows the button's fill in every state.
const NUMBER = {
  base: 'text-button-fill',
  hover: 'group-hover:text-button-hover group-focus-visible:text-button-hover',
  pressed: 'group-active:text-button-active',
  selected: 'text-button-active',
};

export function Button({
  variant = 'normal',
  size = 'normal',
  number,
  selected = false,
  type = 'button',
  disabled = false,
  onClick,
  children,
  'data-testid': dataTestId,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  number?: number;
  selected?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  'data-testid'?: string;
}) {
  const numbered = number !== undefined;
  const buttonType =
    variant === 'alternate' ? 'alternate' : numbered ? 'numbered' : size === 'large' ? 'large' : 'normal';
  const look = variant === 'alternate' ? ALTERNATE : FILLED;
  // Disabled buttons get no hover, focus or press response, and a selected
  // button keeps its look in every state.
  const interactive = !disabled && !selected;

  const layout =
    size === 'large'
      ? 'h-[50px] px-[30px] text-button-large'
      : numbered
        ? 'h-8 gap-2 pl-1 pr-5 text-button-normal'
        : 'h-8 px-5 text-button-normal';

  return (
    <button
      type={type}
      data-testid={dataTestId}
      data-button-type={buttonType}
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      disabled={disabled}
      className={[
        'group inline-flex items-center justify-center whitespace-nowrap rounded-pill border outline-hidden',
        layout,
        selected ? look.selected : look.base,
        interactive ? `${look.hover} ${look.pressed}` : '',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      {numbered ? (
        <>
          <span
            data-button-number
            className={[
              'inline-flex size-6 items-center justify-center rounded-pill bg-inverse',
              selected ? NUMBER.selected : NUMBER.base,
              interactive ? `${NUMBER.hover} ${NUMBER.pressed}` : '',
            ].join(' ')}
          >
            {number}
          </span>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
