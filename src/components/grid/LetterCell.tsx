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
      className="text-cell-letter relative flex h-full w-full items-center justify-center uppercase"
      style={{ fontSize: 'var(--cell-letter-size)', lineHeight: 1 }}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
