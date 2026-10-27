'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';

export type ButtonVariant = 'normal' | 'alternate';
export type ButtonSize = 'normal' | 'large';

// Story F3. Each type's look per state. Hover's look also shows on keyboard
// focus (focus-visible); the selected look shows while selected or pressed.
// Colors change over 150ms (F6 correction).
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

// A numbered button whose step is done (14-S12): gray, 70px wide, the
// label giving way to a check. When it becomes done, the label fades out
// over 150ms, then the check fades in over 150ms, while the fill, border,
// width and number change over 300ms; under reduced motion it changes at
// once.
const DONE = {
  button:
    'w-[70px] overflow-hidden border-button-done bg-button-done ' +
    'transition-[background-color,border-color,width] duration-300 ease-out motion-reduce:transition-none',
  number: 'text-button-done transition-colors duration-300 ease-out motion-reduce:transition-none',
  label: 'opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none',
  check: 'opacity-100 transition-opacity delay-150 duration-150 ease-out motion-reduce:transition-none',
};

// Material Icons' "check", its viewBox cropped to the glyph.
function Check({ className }: { className: string }) {
  return (
    <svg
      data-button-check
      aria-hidden="true"
      viewBox="3.41 5.59 17.59 13.41"
      width="16"
      height="12.2"
      fill="currentColor"
      className={className}
    >
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

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
  done,
  selected = false,
  type = 'button',
  form,
  disabled = false,
  onClick,
  children,
  'data-testid': dataTestId,
  'data-step-id': dataStepId,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  ref,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  number?: number;
  /** A numbered step that can be done: false until it is (14-S12). */
  done?: boolean;
  selected?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Ties a submit button to a form it sits outside, as in a modal footer. */
  form?: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  'data-testid'?: string;
  /** Names a builder step (14-S4). */
  'data-step-id'?: string;
  /** A disclosure's state, as play's Puzzle options (14-S7). */
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  ref?: Ref<HTMLButtonElement>;
}) {
  const numbered = number !== undefined;
  const buttonType =
    variant === 'alternate' ? 'alternate' : numbered ? 'numbered' : size === 'large' ? 'large' : 'normal';
  const look = variant === 'alternate' ? ALTERNATE : FILLED;
  // Disabled buttons get no hover, focus or press response, and a selected
  // button keeps its look in every state.
  const interactive = !disabled && !selected && !done;

  const layout =
    size === 'large'
      ? 'h-[50px] px-[30px] text-button-large'
      : numbered
        ? 'h-8 gap-2 pl-1 pr-5 text-button-normal'
        : 'h-8 px-5 text-button-normal';

  return (
    <button
      ref={ref}
      type={type}
      form={form}
      data-testid={dataTestId}
      data-step-id={dataStepId}
      data-button-type={buttonType}
      aria-current={selected ? 'true' : undefined}
      data-done={done ? 'true' : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      disabled={disabled}
      className={[
        'group relative inline-flex items-center whitespace-nowrap rounded-pill border outline-hidden [interpolate-size:allow-keywords]',
        layout,
        // Done, the faded label overflows the 70px, so the row packs from
        // the start to keep the number in place.
        done ? `justify-start ${DONE.button}` : `justify-center transition-colors duration-150 ease-out ${selected ? look.selected : look.base}`,
        interactive ? `${look.hover} ${look.pressed}` : '',
        done ? 'cursor-default' : disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      {numbered ? (
        <>
          <span
            data-button-number
            className={[
              'inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-inverse',
              done ? DONE.number : `transition-colors duration-150 ease-out ${selected ? NUMBER.selected : NUMBER.base}`,
              interactive ? `${NUMBER.hover} ${NUMBER.pressed}` : '',
            ].join(' ')}
          >
            {number}
          </span>
          {/* Faded out when done, it stays the button's name. */}
          <span data-button-label className={done ? DONE.label : 'transition-opacity duration-150 ease-out'}>
            {children}
          </span>
          {done !== undefined && (
            // 12px from the number's circle, centred in the 40px beside it.
            <Check
              className={`absolute top-1/2 left-[40px] -translate-y-1/2 text-inverse ${
                done ? DONE.check : 'opacity-0'
              }`}
            />
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
}
