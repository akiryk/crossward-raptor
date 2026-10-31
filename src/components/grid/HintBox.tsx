import type { Ref } from 'react';
import type { Grid } from '../../engine/grid';
import type { NumberedSlot } from '../../engine/numbering';
import { slotAnswer } from '../../lib/slot-answer';
import { HintArrow } from '../ui/HintArrow';
import { WrappingField } from '../ui/WrappingField';

/** One hint at a time under the grid, with arrows through the words
 *  (15-S4): a 4px rule on top, a 1px outline on the other sides, 48px
 *  tall for a short word and hint. Nothing is ever cut off (15-S6): the
 *  hint wraps and the box grows; the word sits beside the hint while the
 *  hint keeps 120px, otherwise on its own row above it; the arrows stay
 *  level with the first 30px row. */
export function HintBox({
  grid,
  slot,
  hint,
  isMissing = false,
  disabled,
  inputRef,
  onHintChange,
  onHintFocus,
  onStep,
}: {
  grid: Grid;
  slot: NumberedSlot;
  hint: string;
  /** 3 Publish found this word's hint blank, and it hasn't changed since (17-S1). */
  isMissing?: boolean;
  disabled?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  onHintChange: (text: string) => void;
  onHintFocus: () => void;
  onStep: (step: 1 | -1) => void;
}) {
  const label = `${slot.number} ${slot.orientation === 'across' ? 'Across' : 'Down'}`;

  return (
    <div
      data-testid="hint-box"
      data-missing={isMissing ? 'true' : undefined}
      className="border-hint-box-border border-t-hint-rule flex min-h-12 items-start border border-t-4 px-3 py-[6.5px]"
    >
      <div className="flex h-[30px] items-center">
        <HintArrow direction="previous" onClick={() => onStep(-1)} />
      </div>
      <div className="ml-3 flex min-w-0 flex-1 flex-wrap gap-x-2 gap-y-1">
        <span
          data-testid="hint-box-word"
          className={`text-label min-w-0 ${isMissing ? 'text-error' : 'text-muted'} self-start py-[5px] tracking-[0.1em] break-all uppercase`}
        >
          {slotAnswer(grid, slot)}
        </span>
        <WrappingField
          ref={inputRef}
          data-testid="hint-box-input"
          aria-label={`${label} hint`}
          value={hint}
          onChange={onHintChange}
          onFocus={onHintFocus}
          disabled={disabled}
          aria-invalid={isMissing ? true : undefined}
          className={`text-body-normal text-primary min-w-0 grow basis-[120px] border-b px-[10px] pt-[5px] pb-[4px] outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            isMissing
              ? 'bg-hint-missing border-error'
              : 'bg-hint-box-input focus:border-line-highlight border-transparent'
          }`}
        />
      </div>
      <div className="ml-3 flex h-[30px] items-center">
        <HintArrow direction="next" onClick={() => onStep(1)} />
      </div>
    </div>
  );
}
