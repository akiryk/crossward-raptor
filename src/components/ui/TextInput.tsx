'use client';

import { useId } from 'react';
import { WrappingField } from './WrappingField';

export type TextInputSize = 'regular' | 'large';

// One underlined field (story F5). The 1px bottom line is the only stroke:
// line-muted at rest, line-highlight on focus (no ring, no hover change),
// error whenever an error is shown or the field is marked invalid, focused
// or not.
const SIZE_CLASS: Record<TextInputSize, string> = {
  regular: 'py-1 text-body-normal',
  large: 'py-1.5 text-body-large',
};

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  size?: TextInputSize;
  /** A long value wraps and the field grows, in the same look (15-S6). */
  wrap?: boolean;
  error?: string;
  /** The error line and `aria-invalid`, without a message (17-S1). */
  invalid?: boolean;
  placeholder?: string;
  'data-testid'?: string;
} & (
  | { 'aria-label': string; label?: string; caption?: never }
  | {
      /**
       * The caption under the line (23-S1): `label` style, uppercase, muted,
       * right-aligned. It names the field, so it replaces `aria-label` and
       * can't be combined with the above-the-field `label`.
       */
      caption: string;
      'aria-label'?: never;
      label?: never;
    }
);

export function TextInput({
  value,
  onChange,
  onFocus,
  autoFocus,
  disabled,
  size = 'regular',
  wrap = false,
  label,
  caption,
  error,
  invalid = false,
  'aria-label': ariaLabel,
  placeholder,
  'data-testid': dataTestId,
}: TextInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const isInvalid = Boolean(error) || invalid;
  const line = isInvalid ? 'border-error' : 'border-line-muted focus:border-line-highlight';

  const fieldProps = {
    'data-testid': dataTestId,
    // With a caption, its text names the field; the caption itself is
    // aria-hidden, so the name isn't announced twice (23-S1).
    'aria-label': caption ?? ariaLabel,
    'aria-invalid': isInvalid ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    placeholder,
    value,
    onFocus,
    autoFocus,
    disabled,
    className: `w-full border-b bg-transparent px-1 text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_CLASS[size]} ${line}`,
  };

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
      {wrap ? (
        <WrappingField id={id} {...fieldProps} onChange={onChange} />
      ) : (
        <input
          id={id}
          type="text"
          {...fieldProps}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {caption && (
        <p
          aria-hidden="true"
          data-testid={dataTestId && `${dataTestId}-caption`}
          className="text-label mt-1 text-right tracking-[0.1em] text-muted uppercase"
        >
          {caption}
        </p>
      )}
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
