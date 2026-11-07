import type { NumberedSlot } from '@/engine/numbering';
import { twoHintColumnsClass } from '@/lib/grid-max';

const COLUMNS: { orientation: NumberedSlot['orientation']; heading: string }[] = [
  { orientation: 'across', heading: 'Across' },
  { orientation: 'down', heading: 'Down' },
];

// The number takes a fixed 18px (wider only for three digits) and the hint
// starts 6px after it (14-S7, from the mockup).
const NUMBER_MIN_PX = 18;

/**
 * Player Hints (14-S7): play's Across and Down lists, compact. The selected
 * word's hint has the selected row's background; a click on a hint selects
 * its word.
 */
export function PlayerHints({
  slots,
  hints,
  selectedKey,
  onSelect,
  stacksWhenNarrow = false,
  gridPx = 700,
}: {
  slots: readonly NumberedSlot[];
  hints: Record<string, string>;
  selectedKey: string | null;
  onSelect?: (key: string) => void;
  /** The builder's Preview Hints (18-S7): one column below a 1430px
   *  window, as the Hint Inputs stack, and each column's first number where
   *  the Hint Inputs' is (18-S9). Play and the style guide don't set it. */
  stacksWhenNarrow?: boolean;
  /** With `stacksWhenNarrow`, the grid's width beside it (21-S9). */
  gridPx?: number;
}) {
  const maxNumberDigits = Math.max(1, ...slots.map((slot) => String(slot.number).length));

  const columns = (
    <div className={stacksWhenNarrow ? `flex flex-col gap-8 ${twoHintColumnsClass(gridPx)}` : 'flex gap-8'}>
      {COLUMNS.map(({ orientation, heading }) => (
        <section
          key={orientation}
          data-testid="play-clue-column"
          data-orientation={orientation}
          className="min-w-0 flex-1"
        >
          <h2 className="px-[6px] pt-2 text-title-4 text-primary">{heading}</h2>
          {/* Story 18-S9: 4px lower in the builder, as a Hint Input's
              number sits on its text, below the input's 4px padding. */}
          <ol className={stacksWhenNarrow ? 'mt-[15px]' : 'mt-[11px]'}>
            {slots.filter((slot) => slot.orientation === orientation).map((slot) => {
              const key = `${slot.number}-${orientation}`;
              return (
                <li
                  key={key}
                  data-testid="play-clue"
                  data-clue-key={key}
                  data-active={selectedKey === key ? 'true' : undefined}
                  className={`flex cursor-pointer gap-[6px] px-[6px] py-[6px] ${
                    selectedKey === key ? 'bg-play-cell-selected-row' : ''
                  }`}
                  onClick={onSelect ? () => onSelect(key) : undefined}
                >
                  <span
                    data-testid="play-clue-number"
                    className="shrink-0 text-title-4 text-primary"
                    style={{ minWidth: `max(${NUMBER_MIN_PX}px, ${maxNumberDigits}ch)` }}
                  >
                    {slot.number}
                  </span>{' '}
                  <span data-testid="play-clue-text" className="text-body-normal text-primary">
                    {hints[key] ?? ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );

  // Story 18-S7: stacked in the builder as HintsPanel's columns are (15-S2, 17-S7).
  return stacksWhenNarrow ? <div className="@container">{columns}</div> : columns;
}
