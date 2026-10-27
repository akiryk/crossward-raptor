// The Colors catalog (Story F1): the palette variables and the styles that
// reference them, as declared in globals.css. Style swatches paint through
// their Tailwind utility, so a devtools edit to a variable repaints them.

const VARIABLES: { name: string; hex: string }[] = [
  { name: 'white', hex: '#FFFFFF' },
  { name: 'black', hex: '#000000' },
  { name: 'gray-200', hex: '#DDE0E6' },
  { name: 'gray-400', hex: '#BABCBE' },
  { name: 'gray-500', hex: '#8B909A' },
  { name: 'gray-600', hex: '#757575' },
  { name: 'gray-700', hex: '#14151B' },
  { name: 'interactive-light', hex: '#56B3E5' },
  { name: 'interactive-medium', hex: '#2191CD' },
  { name: 'interactive-dark', hex: '#005B8C' },
  { name: 'interactive-faint', hex: '#F5F7FA' },
  { name: 'interactive-faint-hover', hex: '#EBEFF7' },
  { name: 'yellow-bright', hex: '#FCFF4D' },
  { name: 'yellow-medium', hex: '#FEFFB0' },
  { name: 'yellow-dull', hex: '#E6E6D1' },
  { name: 'cell-warning', hex: '#CEB55A' },
  { name: 'cell-error', hex: '#FF251A' },
  { name: 'text-error', hex: '#E2655F' },
  { name: 'blue-bright', hex: '#4BC0FF' },
  { name: 'blue-medium', hex: '#CFEEFF' },
  { name: 'cyan', hex: '#00F0FF' },
];

// Utility class names are written out in full so Tailwind generates them.
const STYLES: { name: string; variable: string; swatch: string }[] = [
  { name: 'build-cell-on', variable: 'white', swatch: 'bg-build-cell-on' },
  { name: 'build-cell-off', variable: 'gray-200', swatch: 'bg-build-cell-off' },
  { name: 'build-cell-border', variable: 'gray-400', swatch: 'bg-build-cell-border' },
  {
    name: 'build-cell-selected-cell',
    variable: 'yellow-bright',
    swatch: 'bg-build-cell-selected-cell',
  },
  {
    name: 'build-cell-selected-row-on',
    variable: 'yellow-medium',
    swatch: 'bg-build-cell-selected-row-on',
  },
  {
    name: 'build-cell-selected-row-off',
    variable: 'yellow-dull',
    swatch: 'bg-build-cell-selected-row-off',
  },
  { name: 'preview-cell-on', variable: 'white', swatch: 'bg-preview-cell-on' },
  { name: 'preview-cell-off', variable: 'gray-700', swatch: 'bg-preview-cell-off' },
  { name: 'preview-cell-warning', variable: 'cell-warning', swatch: 'bg-preview-cell-warning' },
  { name: 'preview-cell-error', variable: 'cell-error', swatch: 'bg-preview-cell-error' },
  { name: 'preview-cell-border', variable: 'gray-500', swatch: 'bg-preview-cell-border' },
  { name: 'play-cell-on', variable: 'white', swatch: 'bg-play-cell-on' },
  { name: 'play-cell-off', variable: 'gray-700', swatch: 'bg-play-cell-off' },
  { name: 'play-cell-border', variable: 'gray-500', swatch: 'bg-play-cell-border' },
  {
    name: 'play-cell-selected-cell',
    variable: 'yellow-bright',
    swatch: 'bg-play-cell-selected-cell',
  },
  {
    name: 'play-cell-selected-row',
    variable: 'blue-medium',
    swatch: 'bg-play-cell-selected-row',
  },
  { name: 'hint-cell-on', variable: 'white', swatch: 'bg-hint-cell-on' },
  { name: 'hint-cell-off', variable: 'gray-700', swatch: 'bg-hint-cell-off' },
  { name: 'hint-cell-border', variable: 'gray-500', swatch: 'bg-hint-cell-border' },
  { name: 'hint-cell-selected', variable: 'blue-medium', swatch: 'bg-hint-cell-selected' },
  { name: 'hint-cell-cursor', variable: 'yellow-bright', swatch: 'bg-hint-cell-cursor' },
  { name: 'hint-cell-cursor-word', variable: 'yellow-medium', swatch: 'bg-hint-cell-cursor-word' },
  { name: 'hint-cell-locked-on', variable: 'gray-200', swatch: 'bg-hint-cell-locked-on' },
  { name: 'primary', variable: 'black', swatch: 'bg-primary' },
  { name: 'muted', variable: 'gray-500', swatch: 'bg-muted' },
  { name: 'link-muted', variable: 'interactive-light', swatch: 'bg-link-muted' },
  { name: 'highlight', variable: 'blue-bright', swatch: 'bg-highlight' },
  { name: 'error', variable: 'text-error', swatch: 'bg-error' },
  { name: 'subtle', variable: 'gray-600', swatch: 'bg-subtle' },
  { name: 'inverse', variable: 'white', swatch: 'bg-inverse' },
  { name: 'line-muted', variable: 'gray-200', swatch: 'bg-line-muted' },
  { name: 'line-highlight', variable: 'blue-bright', swatch: 'bg-line-highlight' },
  { name: 'line-dark', variable: 'gray-600', swatch: 'bg-line-dark' },
  { name: 'fill-muted', variable: 'gray-200', swatch: 'bg-fill-muted' },
  { name: 'button-fill', variable: 'interactive-light', swatch: 'bg-button-fill' },
  { name: 'button-hover', variable: 'interactive-medium', swatch: 'bg-button-hover' },
  { name: 'button-active', variable: 'interactive-dark', swatch: 'bg-button-active' },
  {
    name: 'button-alternate-border',
    variable: 'gray-500',
    swatch: 'bg-button-alternate-border',
  },
  {
    name: 'button-alternate-hover',
    variable: 'gray-500',
    swatch: 'bg-button-alternate-hover',
  },
  { name: 'button-done', variable: 'gray-400', swatch: 'bg-button-done' },
  { name: 'puzzle-row', variable: 'interactive-faint', swatch: 'bg-puzzle-row' },
  {
    name: 'puzzle-row-hover',
    variable: 'interactive-faint-hover',
    swatch: 'bg-puzzle-row-hover',
  },
  { name: 'modal-background', variable: 'white', swatch: 'bg-modal-background' },
  {
    name: 'modal-title-background',
    variable: 'yellow-bright',
    swatch: 'bg-modal-title-background',
  },
  { name: 'modal-backdrop', variable: 'black at 40%', swatch: 'bg-modal-backdrop' },
  { name: 'logo', variable: 'gray-400', swatch: 'bg-logo' },
  { name: 'logo-cell', variable: 'white', swatch: 'bg-logo-cell' },
  { name: 'masthead', variable: 'white', swatch: 'bg-masthead' },
  { name: 'focus-ring', variable: 'cyan', swatch: 'bg-focus-ring' },
];

// line-muted border keeps white and translucent swatches visible.
const SWATCH = 'h-8 w-8 shrink-0 rounded-md border border-line-muted';
const ROW = 'flex min-w-0 items-center gap-3';
const GRID = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

export function ColorSwatches() {
  return (
    <section data-testid="sg-colors" className="space-y-6">
      <h2 className="font-display text-headline [font-weight:var(--weight-bold)]">Colors</h2>

      <div className="space-y-3">
        <h3 className="text-body text-primary [font-weight:var(--weight-bold)]">Variables</h3>
        <ul className={GRID}>
          {VARIABLES.map(({ name, hex }) => (
            <li key={name} data-testid="sg-color-variable" data-variable={name} className={ROW}>
              <span
                data-testid="sg-swatch"
                className={SWATCH}
                style={{ backgroundColor: `var(--palette-${name})` }}
              />
              <span className="min-w-0 break-words">
                <span className="block text-help text-primary">{name}</span>
                <span className="block text-help text-muted">{hex}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-body text-primary [font-weight:var(--weight-bold)]">Styles</h3>
        <ul className={GRID}>
          {STYLES.map(({ name, variable, swatch }) => (
            <li key={name} data-testid="sg-color-style" data-style={name} className={ROW}>
              <span data-testid="sg-swatch" className={`${SWATCH} ${swatch}`} />
              <span className="min-w-0 break-words">
                <span className="block text-help text-primary">{name}</span>
                <span className="block text-help text-muted">{variable}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
