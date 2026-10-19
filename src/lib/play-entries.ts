import type { SerializedGrid } from './puzzle-storage';

/** Player letters can vary; the published cell geometry cannot. */
export function isCompatiblePlayEntries(
  input: unknown,
  geometry: SerializedGrid
): input is SerializedGrid {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
  const candidate = input as Partial<SerializedGrid>;
  if (!Number.isInteger(candidate.cols) || !Number.isInteger(candidate.rows)
    || candidate.cols !== geometry.cols || candidate.rows !== geometry.rows
    || !Array.isArray(candidate.cells) || candidate.cells.length !== geometry.rows) return false;

  for (let row = 0; row < geometry.rows; row++) {
    const cells = candidate.cells[row];
    if (!Array.isArray(cells) || cells.length !== geometry.cols) return false;
    for (let col = 0; col < geometry.cols; col++) {
      const cell = cells[col];
      if (cell === null || typeof cell !== 'object' || Array.isArray(cell)
        || cell.kind !== geometry.cells[row][col].kind) return false;
      if (cell.kind === 'active') {
        if (cell.letter !== null && (typeof cell.letter !== 'string' || cell.letter.length === 0)) return false;
      } else if (cell.kind !== 'black') return false;
    }
  }
  return true;
}
