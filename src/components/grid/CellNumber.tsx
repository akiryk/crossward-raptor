export function CellNumber({ number }: { number: number }) {
  return (
    <span
      data-testid="cell-number"
      className="text-cell-number text-primary absolute top-0 left-0 p-[1px]"
      // A grid sets the size for its cells (15-S6); elsewhere, cell-number's.
      style={{
        fontSize: 'var(--cell-number-size, var(--text-cell-number))',
        lineHeight: 'var(--cell-number-size, var(--text-cell-number--line-height))',
      }}
    >
      {number}
    </span>
  );
}
