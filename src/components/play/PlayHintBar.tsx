import { HintArrow } from '@/components/ui/HintArrow';

/** Narrow play's one hint under the grid (15-S5): a 4px rule on top,
 *  48px tall, growing when the hint wraps; the arrows step through the
 *  words. */
export function PlayHintBar({
  hint,
  disabled,
  onStep,
}: {
  hint: string;
  disabled?: boolean;
  onStep: (step: 1 | -1) => void;
}) {
  return (
    <div
      data-testid="play-hint-bar"
      className="flex min-h-12 items-center border-t-4 border-t-hint-rule bg-play-hint-bar px-3 py-2"
    >
      <HintArrow direction="previous" disabled={disabled} onClick={() => onStep(-1)} />
      <p data-testid="play-hint-bar-text" className="mx-3 min-w-0 flex-1 text-center text-body-large text-primary">
        {hint}
      </p>
      <HintArrow direction="next" disabled={disabled} onClick={() => onStep(1)} />
    </div>
  );
}
