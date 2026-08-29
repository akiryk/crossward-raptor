import { CellNumber } from './CellNumber';

const HIGHLIGHT_CLASSES: Record<'selected' | 'slot', string> = {
  selected: 'bg-selected',
  slot: 'bg-selected/40',
};

export function LetterCell({
  letter,
  number,
  highlight,
  onClick,
}: {
  letter: string;
  number?: number;
  highlight?: 'selected' | 'slot';
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center border border-grid-line font-data ${highlight ? HIGHLIGHT_CLASSES[highlight] : 'bg-background'}`}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
