'use client';

// Story F6. Off is `button-fill`, on is `button-active`; hovering an off
// toggle, or focusing it by keyboard in either state, shows `button-hover`.
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
}: {
  isPreviewing: boolean;
  onToggle: () => void;
  'data-testid'?: string;
}) {
  const state = isPreviewing ? 'on' : 'off';
  return (
    <label
      data-testid={dataTestId}
      className="group relative inline-flex cursor-pointer items-center gap-2.5 select-none"
    >
      <input
        type="checkbox"
        checked={isPreviewing}
        onChange={onToggle}
        className="peer sr-only"
      />
      <span
        data-toggle-pill
        className={`h-6 w-10 shrink-0 rounded-pill ${PILL[state]}`}
      />
      <span
        data-toggle-knob
        className={`absolute top-0.5 left-0.5 size-5 rounded-pill border bg-inverse transition-transform ${KNOB[state]}`}
      />
      <span data-toggle-label className="text-label text-link-muted">
        Preview
      </span>
    </label>
  );
}
