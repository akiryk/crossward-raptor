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
    // Centered across and low in the cell, as the NYT's: the capitals'
    // ink ends about 0.91 of the pitch down, clear of the number (17-S7).
    <div
      className="text-cell-letter text-primary relative flex h-full w-full items-start justify-center uppercase"
      style={{ fontSize: 'var(--cell-letter-size)', lineHeight: 1, paddingTop: 'calc(var(--cell-pitch, 0px) * 0.35)' }}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
