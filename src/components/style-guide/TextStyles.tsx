// The Text styles catalog (Story F2): each text style declared in
// globals.css, with a sample set through its Tailwind utility, so a devtools
// edit to a `--text-*` token resizes it.

// Utility class names are written out in full so Tailwind generates them.
const STYLES: { name: string; size: number; weight: number; sample: string }[] = [
  { name: 'title-1', size: 44, weight: 600, sample: 'text-title-1' },
  { name: 'title-2', size: 32, weight: 600, sample: 'text-title-2' },
  { name: 'title-3', size: 18, weight: 600, sample: 'text-title-3' },
  { name: 'title-4', size: 14, weight: 600, sample: 'text-title-4' },
  { name: 'label', size: 14, weight: 400, sample: 'text-label' },
  { name: 'button-large', size: 18, weight: 600, sample: 'text-button-large' },
  { name: 'button-normal', size: 14, weight: 600, sample: 'text-button-normal' },
  { name: 'body-large', size: 18, weight: 400, sample: 'text-body-large' },
  { name: 'body-normal', size: 14, weight: 400, sample: 'text-body-normal' },
  { name: 'body-small', size: 12, weight: 400, sample: 'text-body-small' },
  { name: 'hint-number', size: 14, weight: 600, sample: 'text-hint-number' },
  { name: 'cell-letter', size: 16, weight: 400, sample: 'text-cell-letter uppercase' },
  { name: 'cell-number', size: 10, weight: 400, sample: 'text-cell-number' },
];

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

export function TextStyles() {
  return (
    <section data-testid="sg-text-styles" className="space-y-6">
      <h2 className="text-title-2 text-primary">Text styles</h2>

      <ul className="space-y-4">
        {STYLES.map(({ name, size, weight, sample }) => (
          <li
            key={name}
            data-testid="sg-text-style"
            data-text-style={name}
            className="grid min-w-0 gap-1 border-b border-line-muted pb-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
          >
            <span className="min-w-0">
              <span className="block text-title-4 text-primary">{name}</span>
              <span className="block text-body-small text-muted">
                {size}px · {weight}
              </span>
            </span>
            <span
              data-testid="sg-text-sample"
              className={`min-w-0 break-words text-primary ${sample}`}
            >
              {SAMPLE_TEXT}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
