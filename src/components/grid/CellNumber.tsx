export function CellNumber({ number }: { number: number }) {
  return (
    <span
      data-testid="cell-number"
      className="text-cell-number text-primary absolute"
      // A grid sets the size for its cells; elsewhere, cell-number's. The
      // digits' ink sits about 0.10 of the pitch from the cell's top and
      // 0.08 from its left, as the NYT's (17-S7).
      style={{
        fontSize: 'var(--cell-number-size, var(--text-cell-number))',
        lineHeight: 'var(--cell-number-size, var(--text-cell-number--line-height))',
        top: 'calc(var(--cell-pitch, 0px) * 0.07)',
        left: 'calc(var(--cell-pitch, 0px) * 0.06)',
      }}
    >
      {number}
    </span>
  );
}
