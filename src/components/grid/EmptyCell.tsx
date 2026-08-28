import { CellNumber } from './CellNumber';

export function EmptyCell({
  number,
  isSelected,
  onClick,
}: {
  number?: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative h-full w-full border border-grid-line ${isSelected ? 'bg-selected' : 'bg-background'}`}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
    </div>
  );
}
