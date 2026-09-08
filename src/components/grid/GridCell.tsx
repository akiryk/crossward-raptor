import type { Cell } from '../../engine/grid';
import { BlackCell } from './BlackCell';
import { EmptyCell } from './EmptyCell';
import { LetterCell } from './LetterCell';

export function GridCell({
  cell,
  number,
  onClick,
}: {
  cell: Cell;
  number?: number;
  onClick?: () => void;
}) {
  if (cell.kind === 'black') {
    return <BlackCell onClick={onClick} />;
  }
  if (cell.letter !== null) {
    return <LetterCell letter={cell.letter} number={number} onClick={onClick} />;
  }
  return <EmptyCell number={number} onClick={onClick} />;
}
