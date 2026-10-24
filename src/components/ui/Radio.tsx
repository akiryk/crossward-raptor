'use client';

import type { ReactNode } from 'react';

export type RadioVariant = 'form' | 'nav';

export type RadioOption<V extends string> = {
  value: V;
  label: ReactNode;
  /** Extra `data-*` attributes for the option's input, such as a test hook. */
  attributes?: Record<`data-${string}`, string>;
};

// Story F6. `form` is a stacked choice inside a form (the puzzle size);
// `nav` is a row of blue choices (Build/Play). Hovering an unselected
// option, or focusing any option by keyboard, shows the hover color, and
// colors change over 150ms.
const RING = {
  form: 'border-line-dark',
  nav: 'border-link-muted',
};

const LABEL = {
  form: { selected: 'text-body-normal text-primary', unselected: 'text-body-normal text-primary' },
  nav: {
    selected: 'text-title-4 text-button-active group-has-[:focus-visible]:text-button-hover',
    unselected:
      'text-title-4 text-link-muted group-hover:text-button-hover group-has-[:focus-visible]:text-button-hover',
  },
};

export function RadioGroup<V extends string>({
  name,
  label,
  variant = 'form',
  options,
  value,
  onChange,
  'data-testid': dataTestId,
}: {
  name: string;
  /** The group's accessible name. */
  label: string;
  variant?: RadioVariant;
  options: RadioOption<V>[];
  value: V;
  onChange: (value: V) => void;
  'data-testid'?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-testid={dataTestId}
      data-variant={variant}
      className={variant === 'nav' ? 'flex flex-wrap items-center gap-6' : 'flex flex-col gap-3'}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const ring = selected
          ? 'border-button-active focus-visible:border-button-hover'
          : `${RING[variant]} group-hover:border-button-hover focus-visible:border-button-hover`;
        return (
          <label
            key={option.value}
            data-testid={dataTestId ? `${dataTestId}-option` : undefined}
            className="group inline-flex cursor-pointer items-center gap-2 select-none"
          >
            <span className="relative inline-flex size-4 shrink-0">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                {...option.attributes}
                className={`peer size-4 cursor-pointer appearance-none rounded-pill border-2 bg-transparent outline-none transition-colors duration-150 ease-out ${ring}`}
              />
              {selected && (
                <span
                  data-radio-dot
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1 rounded-pill bg-button-active transition-colors duration-150 ease-out peer-focus-visible:bg-button-hover"
                />
              )}
            </span>
            <span data-radio-label className={`transition-colors duration-150 ease-out ${LABEL[variant][selected ? 'selected' : 'unselected']}`}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
