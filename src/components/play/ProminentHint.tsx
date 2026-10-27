/**
 * Prominent Hint (14-S7): the selected word's number and hint in a bar
 * above the play grid, NYT-style. With no word selected the bar stays,
 * empty, so the grid doesn't move.
 */
export function ProminentHint({
  label,
  hint,
}: {
  /** The selected word's number and direction, as "14A", or null. */
  label: string | null;
  hint: string;
}) {
  return (
    <div
      data-testid="prominent-hint"
      className="flex min-h-[52px] items-baseline gap-3 rounded-modal bg-play-cell-selected-row px-4 py-3"
    >
      {label !== null && (
        <>
          <span data-testid="prominent-hint-label" className="shrink-0 text-title-4 text-primary">
            {label}
          </span>
          <span data-testid="prominent-hint-text" className="text-body-large text-primary">
            {hint}
          </span>
        </>
      )}
    </div>
  );
}
