// The arrows' line, drawn in a 24px box like the Hint Box's mockup (15-S4).
function ArrowLine({ direction }: { direction: 'previous' | 'next' }) {
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

/** A 24px button stepping to the previous or next word, shared by the
 *  builder's Hint Box (15-S4) and the play hint bar (15-S5). */
export function HintArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'previous' ? 'Previous word' : 'Next word'}
      disabled={disabled}
      className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-primary disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
    >
      <ArrowLine direction={direction} />
    </button>
  );
}
