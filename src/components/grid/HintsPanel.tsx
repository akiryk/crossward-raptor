import type { Grid } from '../../engine/grid';
import type { NumberedSlot } from '../../engine/numbering';
import { isHintFilled } from '../../lib/hint-lookup';
import { slotAnswer } from '../../lib/slot-answer';
import { TextInput } from '../ui/TextInput';

const COLUMNS: { orientation: NumberedSlot['orientation']; heading: string }[] = [
  { orientation: 'across', heading: 'Across' },
  { orientation: 'down', heading: 'Down' },
];

export function HintsPanel({
  grid,
  slots,
  hints,
  activeKey,
  disabled,
  onHintChange,
  onHintFocus,
}: {
  grid: Grid;
  slots: ReadonlyMap<string, NumberedSlot>;
  hints: Record<string, string>;
  activeKey: string | null;
  disabled?: boolean;
  onHintChange: (key: string, text: string) => void;
  onHintFocus: (key: string) => void;
}) {
  const entries = Array.from(slots.entries());
  // Both columns share these widths (Decisions: "measured across every
  // slot in the puzzle"), so every input's left edge lands at the same x
  // regardless of which column or row it's in.
  const maxNumberDigits = Math.max(1, ...entries.map(([, slot]) => String(slot.number).length));
  const maxAnswerLength = Math.max(
    1,
    ...entries.map(([, slot]) => slotAnswer(grid, slot).length)
  );

  return (
    <div className="flex gap-6">
      {COLUMNS.map(({ orientation, heading }) => (
        <div
          key={orientation}
          data-testid="hint-column"
          data-orientation={orientation}
          className="flex-1"
        >
          <h3 data-testid="hint-column-heading" className="text-label text-ink-3 mb-2">
            {heading}
          </h3>
          {entries
            .filter(([, slot]) => slot.orientation === orientation)
            .map(([key, slot]) => {
              const label = `${slot.number} ${slot.orientation === 'across' ? 'Across' : 'Down'}`;
              return (
                <div
                  key={key}
                  data-testid="hint-row"
                  data-hint-key={key}
                  data-complete={isHintFilled(hints, key) ? 'true' : 'false'}
                  data-active={activeKey === key ? 'true' : undefined}
                  className="mb-3 flex items-baseline gap-2"
                >
                  <span
                    data-testid="hint-label"
                    className="text-label text-ink-3 shrink-0 text-right"
                    style={{ width: `${maxNumberDigits}ch` }}
                  >
                    {slot.number}
                  </span>
                  <span
                    data-testid="hint-answer"
                    className="text-label text-foreground shrink-0 text-left"
                    style={{ width: `${maxAnswerLength}ch` }}
                  >
                    {slotAnswer(grid, slot)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TextInput
                      data-testid="hint-input"
                      aria-label={`${label} clue`}
                      variant="underline"
                      value={hints[key] ?? ''}
                      onChange={(text) => onHintChange(key, text)}
                      onFocus={() => onHintFocus(key)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
