import { CellNumber } from './CellNumber';

export function LetterCell({ letter, number }: { letter: string; number?: number }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center border border-grid-line bg-background font-data">
      {number !== undefined && <CellNumber number={number} />}
      {letter}
    </div>
  );
}
