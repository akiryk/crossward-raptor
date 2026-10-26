export function CellNumber({ number }: { number: number }) {
  return (
    <span
      data-testid="cell-number"
      className="text-cell-number absolute top-0 left-0 p-[1px]"
    >
      {number}
    </span>
  );
}
