'use client';

// Story F6. Off is `button-fill`, on is `button-active`; hovering an off
// toggle, or focusing it by keyboard in either state, shows `button-hover`.
// The label is `link-muted` when off and `button-active` when on. Colors
// change over 150ms.
const PILL = {
  off: 'bg-button-fill group-hover:bg-button-hover peer-focus-visible:bg-button-hover',
  on: 'bg-button-active peer-focus-visible:bg-button-hover',
};

const KNOB = {
  off: 'border-button-fill group-hover:border-button-hover peer-focus-visible:border-button-hover',
  on: 'translate-x-4 border-button-active peer-focus-visible:border-button-hover',
};

export function PreviewToggle({
  isPreviewing,
  onToggle,
  'data-testid': dataTestId = 'preview-toggle',
  label = 'Preview',
  disabled = false,
}: {
  isPreviewing: boolean;
  onToggle: () => void;
  'data-testid'?: string;
  /** The hints phase's Lock Grid Letters uses the same toggle (14-S12). */
  label?: string;
  /** Inactive, its state kept: Lock Grid Letters while Preview Hints is on (17-S9). */
  disabled?: boolean;
}) {
  const state = isPreviewing ? 'on' : 'off';
  return (
    <label
      data-testid={dataTestId}
      data-disabled={disabled ? 'true' : undefined}
      className={`group relative inline-flex items-center gap-2 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={isPreviewing}
        onChange={onToggle}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        data-toggle-pill
        className={`h-6 w-10 shrink-0 rounded-pill transition-colors duration-150 ease-out ${PILL[state]}`}
      />
      <span
        data-toggle-knob
        className={`absolute top-0.5 left-0.5 size-5 rounded-pill border bg-inverse transition-[translate,border-color] duration-150 ease-out ${KNOB[state]}`}
      />
      <span
        data-toggle-label
        className={`text-label transition-colors duration-150 ease-out ${isPreviewing ? 'text-button-active' : 'text-link-muted'}`}
      >
        {label}
      </span>
    </label>
  );
}
