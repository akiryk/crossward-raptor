export function CellNumber({ number }: { number: number }) {
  return (
    <span
      data-testid="cell-number"
      className="text-cell-number text-primary absolute"
      // A grid sets the size for its cells (15-S6); elsewhere, cell-number's.
      // At the top left, or on a Sunday where the NYT's sits (17-S7).
      style={{
        fontSize: 'var(--cell-number-size, var(--text-cell-number))',
        lineHeight: 'var(--cell-number-size, var(--text-cell-number--line-height))',
        top: 'var(--cell-number-top, 0px)',
        left: 'var(--cell-number-left, 0px)',
        padding: 'var(--cell-number-pad, 1px)',
      }}
    >
      {number}
    </span>
  );
}
