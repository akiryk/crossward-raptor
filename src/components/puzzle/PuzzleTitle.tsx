import { WrappingField } from '../ui/WrappingField';

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
    <WrappingField
      data-testid="puzzle-title"
      aria-label="Puzzle title"
      value={value}
      onChange={onChange}
      disabled={disabled}
      // Story 14-S4. Reads as the page's title: no border at rest, a 1px
      // underline on hover (`line-muted`) and while focused (`primary`).
      // The underline is always present but transparent, so it never
      // moves the buttons 32px below. `block`, because an inline-block
      // input's margin doesn't collapse with its neighbours'. Narrow,
      // `title-3`, 16px above the buttons (15-S3). A long title wraps, the
      // field growing and the underline under its last line (15-S6).
      className="mb-4 block w-full border-0 border-b border-transparent bg-transparent p-0 text-title-3 text-primary @min-[952px]/editor:mb-8 @min-[952px]/editor:text-title-1 outline-none hover:border-line-muted focus:border-primary disabled:cursor-default disabled:hover:border-transparent"
    />
  );
}
