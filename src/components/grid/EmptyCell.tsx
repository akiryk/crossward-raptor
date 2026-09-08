import { CellNumber } from './CellNumber';

export function EmptyCell({
  number,
  onClick,
}: {
  number?: number;
  onClick?: () => void;
}) {
  return (
    <div className="relative h-full w-full" onClick={onClick}>
      {number !== undefined && <CellNumber number={number} />}
    </div>
  );
}
