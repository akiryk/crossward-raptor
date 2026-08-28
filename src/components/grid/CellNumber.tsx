export function CellNumber({ number }: { number: number }) {
  return (
    <span
      data-testid="cell-number"
      className="absolute top-0 left-0 p-[0.1em] text-[0.6em] leading-none"
    >
      {number}
    </span>
  );
}
