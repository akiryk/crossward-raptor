import { CellNumber } from './CellNumber';

const HIGHLIGHT_CLASSES: Record<'selected' | 'slot', string> = {
  selected: 'bg-selected',
  slot: 'bg-selected/40',
};

export function EmptyCell({
  number,
  highlight,
  onClick,
}: {
  number?: number;
  highlight?: 'selected' | 'slot';
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative h-full w-full border border-grid-line ${highlight ? HIGHLIGHT_CLASSES[highlight] : 'bg-background'}`}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
    </div>
  );
}
