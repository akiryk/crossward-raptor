import type { Cell } from '../../engine/grid';
import { BlackCell } from './BlackCell';
import { EmptyCell } from './EmptyCell';
import { LetterCell } from './LetterCell';

export function GridCell({ cell, number }: { cell: Cell; number?: number }) {
  if (cell.kind === 'black') {
    return <BlackCell />;
  }
  if (cell.letter !== null) {
    return <LetterCell letter={cell.letter} number={number} />;
  }
  return <EmptyCell number={number} />;
}
