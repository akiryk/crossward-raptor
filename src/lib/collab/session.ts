// Epic 24 (24-S7): the session panel's words. Join and leave notes come from
// changes to the present set the catch-up answers (`PresenceNotes`); other
// builders' Enter Hints and Start Over are noted (`operationNote`); times and
// days are formatted for the panel. Pure: no React, DOM or network.

import type { Operation } from './operation';
import type { Builder } from './presence';

/** An account gone this long is noted as having left; one back sooner (a
 *  reload) makes no notes. */
export const LEAVE_GRACE_MS = 5_000;

/** A builder's name in a note. */
export function builderName(username: string | null | undefined): string {
  const name = username?.trim();
  return name ? name : 'A builder';
}

function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Follows the present set from one catch-up to the next and says what
 *  changed. The first answer is the baseline. */
export class PresenceNotes {
  private known: Map<string, Builder> | null = null;
  /** Accounts gone from the set, and since when. */
  private readonly gone = new Map<string, number>();

  update(present: readonly Builder[], now: number): string[] {
    if (this.known === null) {
      this.known = new Map(present.map((builder) => [builder.userId, builder]));
      if (present.length === 0) return [];
      const names = present.map((builder) => builderName(builder.username));
      return [`You joined. ${listNames(names)} ${names.length === 1 ? 'is' : 'are'} here.`];
    }
    const notes: string[] = [];
    const here = new Set(present.map((builder) => builder.userId));
    for (const builder of present) {
      if (this.gone.delete(builder.userId)) continue;
      if (!this.known.has(builder.userId)) notes.push(`${builderName(builder.username)} joined the session.`);
      this.known.set(builder.userId, builder);
    }
    for (const [userId, builder] of this.known) {
      if (here.has(userId)) continue;
      const since = this.gone.get(userId);
      if (since === undefined) {
        this.gone.set(userId, now);
      } else if (now - since >= LEAVE_GRACE_MS) {
        this.gone.delete(userId);
        this.known.delete(userId);
        notes.push(`${builderName(builder.username)} left the session.`);
      }
    }
    return notes;
  }
}

/** The note for another builder's structural operation, or null. */
export function operationNote(op: Operation, author: Builder | null): string | null {
  const name = builderName(author?.username);
  if (op.kind === 'enterHints') return `${name} moved the puzzle to Create Hints.`;
  if (op.kind === 'startOver') return `${name} started over.`;
  return null;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A note's time: 24-hour local "HH:MM". */
export function formatNoteTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The panel's date heading: "Nov 8, 2026". */
export function formatNoteDay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
