import { CellNumber } from './CellNumber';

export function LetterCell({
  letter,
  number,
  isSelected,
  onClick,
}: {
  letter: string;
  number?: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center border border-grid-line font-data ${isSelected ? 'bg-selected' : 'bg-background'}`}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
