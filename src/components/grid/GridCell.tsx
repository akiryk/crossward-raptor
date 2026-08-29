import type { Cell } from '../../engine/grid';
import { BlackCell } from './BlackCell';
import { EmptyCell } from './EmptyCell';
import { LetterCell } from './LetterCell';

export function GridCell({
  cell,
  number,
  highlight,
  onClick,
}: {
  cell: Cell;
  number?: number;
  highlight?: 'selected' | 'slot';
  onClick?: () => void;
}) {
  if (cell.kind === 'black') {
    return <BlackCell onClick={onClick} />;
  }
  if (cell.letter !== null) {
    return (
      <LetterCell letter={cell.letter} number={number} highlight={highlight} onClick={onClick} />
    );
  }
  return <EmptyCell number={number} highlight={highlight} onClick={onClick} />;
}
