const DEFAULT_TITLE = 'Untitled Puzzle';

/** Trims the input. A blank or whitespace-only title falls back to the
 *  schema default, so no puzzle can end up nameless in the list. */
export function normalizeTitle(input: string): string {
  const trimmed = input.trim();
  return trimmed === '' ? DEFAULT_TITLE : trimmed;
}

/** Trims the input and rejects a blank result. Unlike normalizeTitle,
 *  used only at creation time (Story D6): the dialog requires a real
 *  name up front, so a blank title here means the caller bypassed the
 *  dialog's own validation, not a legitimate "no title yet" state. */
export function requireTitle(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('A puzzle title is required.');
  }
  return trimmed;
}
