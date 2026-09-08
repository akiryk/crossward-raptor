import type { NumberedSlot } from '../../engine/numbering';
import { isHintFilled } from '../../lib/hint-lookup';
import { TextInput } from '../ui/TextInput';

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
      {Array.from(slots.entries()).map(([key, slot]) => {
        const label = `${slot.number} ${slot.orientation === 'across' ? 'Across' : 'Down'}`;
        return (
          <div
            key={key}
            data-testid="hint-row"
            data-hint-key={key}
            data-complete={isHintFilled(hints, key) ? 'true' : 'false'}
            data-active={activeKey === key ? 'true' : undefined}
          >
            <span>{label}</span>
            <TextInput
              data-testid="hint-input"
              aria-label={`${label} clue`}
              value={hints[key] ?? ''}
              onChange={(text) => onHintChange(key, text)}
              onFocus={() => onHintFocus(key)}
            />
          </div>
        );
      })}
    </div>
  );
}
