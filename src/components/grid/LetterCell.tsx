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
    // Centered, or on a Sunday low in the cell, as the NYT's (17-S7): the
    // grid sets the alignment and the space above.
    <div
      className="text-cell-letter text-primary relative flex h-full w-full justify-center uppercase"
      style={{
        fontSize: 'var(--cell-letter-size)',
        lineHeight: 1,
        alignItems: 'var(--cell-letter-align, center)',
        paddingTop: 'var(--cell-letter-top, 0px)',
      }}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
