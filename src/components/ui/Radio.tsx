'use client';

import type { ReactNode } from 'react';

export type RadioOption<V extends string> = {
  value: V;
  label: ReactNode;
  /** Extra `data-*` attributes for the option's input, such as a test hook. */
  attributes?: Record<`data-${string}`, string>;
};

// Story F6. A stacked choice inside a form (the puzzle size). Hovering an
// unselected option, or focusing any option by keyboard, shows the hover
// color, and colors change over 150ms.
const RING = 'border-line-dark';

const LABEL = 'text-body-small text-primary';

export function RadioGroup<V extends string>({
  name,
  label,
  labelledBy,
  options,
  value,
  onChange,
  'data-testid': dataTestId,
}: {
  name: string;
  /** The group's accessible name, when no visible heading names it. */
  label?: string;
  /** The id of a visible heading that names the group, used instead of `label`. */
  labelledBy?: string;
  options: RadioOption<V>[];
  value: V;
  onChange: (value: V) => void;
  'data-testid'?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      data-testid={dataTestId}
      data-variant="form"
      className="flex flex-col gap-3"
    >
      {options.map((option) => {
        const selected = option.value === value;
        const ring = selected
          ? 'border-button-active focus-visible:border-button-hover'
          : `${RING} group-hover:border-button-hover focus-visible:border-button-hover`;
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
            <span data-radio-label className={`transition-colors duration-150 ease-out ${LABEL}`}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
