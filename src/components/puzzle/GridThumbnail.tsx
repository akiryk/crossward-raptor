export function GridThumbnail({
  cols,
  rows,
  black,
}: {
  cols: number;
  rows: number;
  black: boolean[][];
}) {
  return (
    <div
      data-testid="puzzle-thumbnail"
      aria-hidden="true"
      className="grid size-10 shrink-0 border border-rule-strong"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {black.flatMap((rowCells, row) =>
        rowCells.map((isBlack, col) => (
          <div
            key={`${col},${row}`}
            data-black={isBlack ? 'true' : 'false'}
            className={isBlack ? 'bg-foreground' : 'bg-background'}
          />
        ))
      )}
    </div>
  );
}
