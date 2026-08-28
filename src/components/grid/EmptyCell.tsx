import { CellNumber } from './CellNumber';

export function EmptyCell({ number }: { number?: number }) {
  return (
    <div className="relative h-full w-full border border-grid-line bg-background">
      {number !== undefined && <CellNumber number={number} />}
    </div>
  );
}
