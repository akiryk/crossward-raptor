import type { NumberedSlot } from '@/engine/numbering';
import { parseClueReference } from '@/lib/clue-reference';

export function ClueText({ text, slots, ownKey }: {
  text: string;
  slots: ReadonlyMap<string, NumberedSlot>;
  ownKey?: string;
}) {
  if (!parseClueReference(text, slots, ownKey)) return text;
  return <><span data-testid="linked-clue-with" className="bg-linked-clue">{text.slice(0, 4)}</span>{text.slice(4)}</>;
}
