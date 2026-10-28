import type { NumberedSlot } from '@/engine/numbering';

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
}: {
  slots: readonly NumberedSlot[];
  hints: Record<string, string>;
  selectedKey: string | null;
  onSelect?: (key: string) => void;
}) {
  const maxNumberDigits = Math.max(1, ...slots.map((slot) => String(slot.number).length));

  return (
    <div className="flex gap-8">
      {COLUMNS.map(({ orientation, heading }) => (
        <section
          key={orientation}
          data-testid="play-clue-column"
          data-orientation={orientation}
          className="min-w-0 flex-1"
        >
          <h2 className="px-[6px] pt-2 text-title-4 text-primary">{heading}</h2>
          <ol className="mt-[11px]">
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
}
