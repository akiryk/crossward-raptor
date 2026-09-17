'use client';

export function PreviewToggle({
  isPreviewing,
  onToggle,
}: {
  isPreviewing: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      data-testid="preview-toggle"
      className="relative inline-flex cursor-pointer items-center gap-2.5 select-none"
    >
      <input
        type="checkbox"
        checked={isPreviewing}
        onChange={onToggle}
        className="peer sr-only"
      />
      <span className="h-6 w-10 shrink-0 rounded-full bg-rule-strong transition-colors peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
      <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4" />
      <span className="text-body text-ink-2">Preview</span>
    </label>
  );
}
