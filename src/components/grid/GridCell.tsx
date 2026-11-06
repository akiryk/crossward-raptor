import type { Cell } from '../../engine/grid';
import { BlackCell } from './BlackCell';
import { EmptyCell } from './EmptyCell';
import { LetterCell } from './LetterCell';

export function GridCell({
  cell,
  number,
  isLocked = false,
  onClick,
}: {
  cell: Cell;
  number?: number;
  /** Build phase: the letter is in a locked word (21-S2). */
  isLocked?: boolean;
  onClick?: () => void;
}) {
  if (cell.kind === 'black') {
    return <BlackCell onClick={onClick} />;
  }
  if (cell.letter !== null) {
    return <LetterCell letter={cell.letter} number={number} isLocked={isLocked} onClick={onClick} />;
  }
  return <EmptyCell number={number} onClick={onClick} />;
}
