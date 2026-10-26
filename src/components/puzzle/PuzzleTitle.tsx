export function PuzzleTitle({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      data-testid="puzzle-title"
      aria-label="Puzzle title"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      // Story 14-S4. Reads as the page's title: no border at rest, a 1px
      // underline on hover (`line-muted`) and while focused (`primary`).
      // The underline is always present but transparent, so it never
      // moves the buttons 32px below. `block`, because an inline-block
      // input's margin doesn't collapse with its neighbours'.
      className="mb-8 block w-full border-0 border-b border-transparent bg-transparent p-0 text-title-1 text-primary outline-none hover:border-line-muted focus:border-primary disabled:cursor-default disabled:hover:border-transparent"
    />
  );
}
