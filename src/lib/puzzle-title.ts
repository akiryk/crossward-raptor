const DEFAULT_TITLE = 'Untitled Puzzle';

/** Trims the input. A blank or whitespace-only title falls back to the
 *  schema default, so no puzzle can end up nameless in the list. */
export function normalizeTitle(input: string): string {
  const trimmed = input.trim();
  return trimmed === '' ? DEFAULT_TITLE : trimmed;
}
