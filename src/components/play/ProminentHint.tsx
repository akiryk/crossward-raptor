/**
 * Prominent Hint: the selected word's hint in a bar
 * above the play grid, NYT-style. With no word selected the bar stays,
 * empty, so the grid doesn't move.
 */
export function ProminentHint({
  hint,
}: {
  hint: string;
}) {
  const hasHint = hint.trim().length > 0;
  return (
    <div
      data-testid="prominent-hint"
      className={`flex min-h-[52px] items-baseline rounded-modal px-4 py-3 ${hasHint ? 'bg-play-cell-selected-row' : 'bg-prominent-hint-empty'}`}
    >
      {hasHint && (
        <span data-testid="prominent-hint-text" className="text-title-3 text-primary">
          {hint}
        </span>
      )}
    </div>
  );
}
