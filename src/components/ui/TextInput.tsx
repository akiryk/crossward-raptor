'use client';

import { useId } from 'react';

export type TextInputSize = 'regular' | 'large';

// One underlined field (story F5). The 1px bottom line is the only stroke:
// line-muted at rest, line-highlight on focus (no ring, no hover change),
// error whenever an error is shown, focused or not.
const SIZE_CLASS: Record<TextInputSize, string> = {
  regular: 'py-1 text-body-normal',
  large: 'py-1.5 text-body-large',
};

export function TextInput({
  value,
  onChange,
  onFocus,
  autoFocus,
  disabled,
  size = 'regular',
  label,
  error,
  'aria-label': ariaLabel,
  placeholder,
  'data-testid': dataTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  size?: TextInputSize;
  label?: string;
  error?: string;
  'aria-label': string;
  placeholder?: string;
  'data-testid'?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const line = error ? 'border-error' : 'border-line-muted focus:border-line-highlight';

  return (
    <div className="flex w-full flex-col">
      {label && (
        <label
          htmlFor={id}
          data-testid={dataTestId && `${dataTestId}-label`}
          className="mb-2 text-title-4 text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full border-b bg-transparent px-1 text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_CLASS[size]} ${line}`}
      />
      {error && (
        <p
          id={errorId}
          data-testid={dataTestId && `${dataTestId}-error`}
          className="mt-2 text-body-normal text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
