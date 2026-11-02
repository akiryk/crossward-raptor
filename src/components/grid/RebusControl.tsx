'use client';

// Does what Escape does, for devices without a keyboard (17-S10): a text
// link in the builder's toggle row, an outlined pill in play. It never takes
// focus from the grid or an open entry when clicked.
export function RebusControl({
  variant,
  isOpen,
  disabled = false,
  onClick,
}: {
  variant: 'link' | 'pill';
  isOpen: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const look =
    variant === 'link'
      ? `text-label ${isOpen ? 'text-button-active' : 'text-link-muted'} enabled:hover:text-button-hover focus-visible:text-button-hover`
      : `h-8 rounded-pill border px-5 text-button-normal ${
          isOpen ? 'border-button-active bg-button-active text-inverse' : 'border-button-fill text-button-fill enabled:hover:border-button-hover enabled:hover:text-button-hover focus-visible:border-button-hover focus-visible:text-button-hover'
        }`;
  return (
    <button
      type="button"
      data-testid="rebus-control"
      aria-pressed={isOpen}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`shrink-0 cursor-pointer outline-hidden transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${look}`}
    >
      Rebus
    </button>
  );
}
