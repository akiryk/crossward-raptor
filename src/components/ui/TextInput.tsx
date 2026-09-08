'use client';

export function TextInput({
  value,
  onChange,
  onFocus,
  'aria-label': ariaLabel,
  placeholder,
  'data-testid': dataTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
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
      // The border is subtle by default (--color-rule) rather than
      // invisible, since the affordance must always be visible, not
      // hover-only (D2 decision) -- it strengthens to --color-accent on
      // both hover and focus, uniformly for every use of this component.
      className="rounded-md border border-rule bg-background px-3 py-2 text-foreground outline-none hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent"
    />
  );
}
