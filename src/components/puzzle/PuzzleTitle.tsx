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
      // Reads as a page title, not a form field, until interacted with:
      // no visible border by default (unlike TextInput's always-on one),
      // a subtle outline on hover, and the normal input look only once
      // focused. Font size/weight stay constant across all three states.
      // The negative left margin offsets px-1's padding so the text lines
      // up flush with the rest of the page instead of looking indented,
      // without removing the padding the hover/focus outline needs.
      // `block`: an <input> defaults to inline-block, and inline-block
      // boxes never participate in margin collapsing with a sibling --
      // that's what was making mb-6 here and the Stepper's mt-6 add up
      // to 48px instead of collapsing to 24px like every other adjacent
      // pair in this component already does.
      className="-ml-2 mb-4 block w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-title text-foreground outline-none [font-weight:var(--weight-bold)] hover:border-rule-strong focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:hover:border-transparent"
    />
  );
}
