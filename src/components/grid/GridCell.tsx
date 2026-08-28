import type { Cell } from '../../engine/grid';
import { BlackCell } from './BlackCell';
import { EmptyCell } from './EmptyCell';
import { LetterCell } from './LetterCell';

export function GridCell({
  cell,
  number,
  isSelected,
  onClick,
}: {
  cell: Cell;
  number?: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  if (cell.kind === 'black') {
    return <BlackCell isSelected={isSelected} onClick={onClick} />;
  }
  if (cell.letter !== null) {
    return (
      <LetterCell letter={cell.letter} number={number} isSelected={isSelected} onClick={onClick} />
    );
  }
  return <EmptyCell number={number} isSelected={isSelected} onClick={onClick} />;
}
