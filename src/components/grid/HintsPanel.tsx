import type { Grid } from '../../engine/grid';
import type { NumberedSlot } from '../../engine/numbering';
import { isHintFilled } from '../../lib/hint-lookup';
import { slotAnswer } from '../../lib/slot-answer';
import { TextInput } from '../ui/TextInput';

const COLUMNS: { orientation: NumberedSlot['orientation']; heading: string }[] = [
  { orientation: 'across', heading: 'Across' },
  { orientation: 'down', heading: 'Down' },
];

// The hints phase keeps the build skeleton's frame (14-S6): the number
// takes the dot's 18px (wider only for three digits), 12px before the
// line, the first line 45px below the label and the lines 58px apart.
const NUMBER_MIN_PX = 18;

// While the grid has focus, its cursor word's hint input is filled like
// the cursor cell (14-S12).
const SELECTED = '[&_input]:bg-hint-cell-cursor';

/** Hint Inputs, one per word, in the hint skeleton's frame (14-S6). */
export function HintsPanel({
  grid,
  slots,
  hints,
  activeKey,
  disabled,
  selectedKey = null,
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
  /** While the grid has focus, the hint of its cursor's word. */
  selectedKey?: string | null;
}) {
  const entries = Array.from(slots.entries());
  // One width for every number in both columns, so every line starts at
  // the same x.
  const maxNumberDigits = Math.max(1, ...entries.map(([, slot]) => String(slot.number).length));

  return (
    <div className="@container">
      {/* One column below 650px of room beside the grid, a 1290px window (15-S2). */}
      <div className="flex flex-col gap-8 @min-[650px]:flex-row">
        {COLUMNS.map(({ orientation, heading }) => (
          <div
            key={orientation}
            data-testid="hint-column"
            data-orientation={orientation}
            className="min-w-0 flex-1"
          >
            <h3
              data-testid="hint-column-heading"
              className="text-title-4 text-primary pt-2"
            >
              {heading}
            </h3>
            <div className="mt-[17px]">
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
                      className={`group flex items-baseline gap-3 not-first:mt-[5px] ${
                        selectedKey === key ? SELECTED : ''
                      }`}
                    >
                      <span
                        data-testid="hint-label"
                        className="text-title-4 text-primary shrink-0"
                        style={{ minWidth: `max(${NUMBER_MIN_PX}px, ${maxNumberDigits}ch)` }}
                      >
                        {slot.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <TextInput
                          data-testid="hint-input"
                          aria-label={`${label} hint`}
                          value={hints[key] ?? ''}
                          onChange={(text) => onHintChange(key, text)}
                          onFocus={() => onHintFocus(key)}
                          disabled={disabled}
                        />
                        <p
                          data-testid="hint-answer"
                          className="text-label text-muted group-focus-within:text-primary mt-1 text-right tracking-[0.1em]"
                        >
                          {slotAnswer(grid, slot)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
