import { TextInput } from '../ui/TextInput';

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
    <TextInput
      data-testid="puzzle-title"
      aria-label="Puzzle title"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
