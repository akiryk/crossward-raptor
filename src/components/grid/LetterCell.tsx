import { CellNumber } from './CellNumber';

export function LetterCell({
  letter,
  number,
  onClick,
}: {
  letter: string;
  number?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center font-data"
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
