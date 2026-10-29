import type { Ref } from 'react';
import type { Grid } from '../../engine/grid';
import type { NumberedSlot } from '../../engine/numbering';
import { slotAnswer } from '../../lib/slot-answer';

// The arrows' line, drawn in a 24px box like the mockup's.
function Arrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={direction === 'previous' ? 'rotate-180' : undefined}
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

const ARROW = 'flex size-6 shrink-0 cursor-pointer items-center justify-center text-primary';

/** One hint at a time under the grid, with arrows through the words
 *  (15-S4): a 4px rule on top, a 1px outline on the other sides, 48px
 *  tall. */
export function HintBox({
  grid,
  slot,
  hint,
  disabled,
  inputRef,
  onHintChange,
  onHintFocus,
  onStep,
}: {
  grid: Grid;
  slot: NumberedSlot;
  hint: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onHintChange: (text: string) => void;
  onHintFocus: () => void;
  onStep: (step: 1 | -1) => void;
}) {
  const label = `${slot.number} ${slot.orientation === 'across' ? 'Across' : 'Down'}`;

  return (
    <div
      data-testid="hint-box"
      className="border-hint-box-border border-t-hint-rule flex h-12 items-center border border-t-4 px-3"
    >
      <button type="button" aria-label="Previous word" className={ARROW} onClick={() => onStep(-1)}>
        <Arrow direction="previous" />
      </button>
      <span
        data-testid="hint-box-word"
        className="text-label text-muted ml-3 shrink-0 tracking-[0.1em] uppercase"
      >
        {slotAnswer(grid, slot)}
      </span>
      <input
        ref={inputRef}
        type="text"
        data-testid="hint-box-input"
        aria-label={`${label} hint`}
        value={hint}
        onChange={(event) => onHintChange(event.target.value)}
        onFocus={onHintFocus}
        disabled={disabled}
        className="bg-hint-box-input text-body-normal text-primary focus:border-line-highlight ml-2 h-[30px] min-w-0 flex-1 border-b border-transparent pr-[10px] pl-[10px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button type="button" aria-label="Next word" className={`${ARROW} ml-3`} onClick={() => onStep(1)}>
        <Arrow direction="next" />
      </button>
    </div>
  );
}
