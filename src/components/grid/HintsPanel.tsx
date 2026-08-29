import type { NumberedSlot } from '../../engine/numbering';
import { isHintFilled } from '../../lib/hint-lookup';

export function HintsPanel({
  slots,
  hints,
  activeKey,
  onHintChange,
  onHintFocus,
}: {
  slots: ReadonlyMap<string, NumberedSlot>;
  hints: Record<string, string>;
  activeKey: string | null;
  onHintChange: (key: string, text: string) => void;
  onHintFocus: (key: string) => void;
}) {
  return (
    <div>
      {Array.from(slots.entries()).map(([key, slot]) => (
        <div
          key={key}
          data-testid="hint-row"
          data-hint-key={key}
          data-complete={isHintFilled(hints, key) ? 'true' : 'false'}
          data-active={activeKey === key ? 'true' : undefined}
        >
          <span>
            {slot.number} {slot.orientation === 'across' ? 'Across' : 'Down'}
          </span>
          <input
            data-testid="hint-input"
            type="text"
            value={hints[key] ?? ''}
            onChange={(event) => onHintChange(key, event.target.value)}
            onFocus={() => onHintFocus(key)}
          />
        </div>
      ))}
    </div>
  );
}
