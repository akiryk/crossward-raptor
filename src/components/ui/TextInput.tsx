'use client';

export type TextInputVariant = 'box' | 'underline';

// 'box' is exactly the original styling, unchanged. 'underline' drops the
// border, radius, focus ring and horizontal padding, keeping a single
// bottom rule that strengthens to --color-accent on hover and focus --
// the same affordance rule (D2) as 'box', just drawn with one line
// instead of four.
const VARIANT_CLASS: Record<TextInputVariant, string> = {
  box: 'rounded-md border border-rule bg-background px-3 py-2 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent',
  underline:
    'border-b border-rule bg-transparent hover:border-accent focus:border-accent',
};

export function TextInput({
  value,
  onChange,
  onFocus,
  autoFocus,
  disabled,
  variant = 'box',
  'aria-label': ariaLabel,
  placeholder,
  'data-testid': dataTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  variant?: TextInputVariant;
  'aria-label': string;
  placeholder?: string;
  'data-testid'?: string;
}) {
  return (
    <input
      type="text"
      data-testid={dataTestId}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      autoFocus={autoFocus}
      disabled={disabled}
      className={`text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]}`}
    />
  );
}
