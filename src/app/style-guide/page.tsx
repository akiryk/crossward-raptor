import { TokenPanel } from '@/components/style-guide/TokenPanel';

type CellState = 'empty' | 'letter' | 'black' | 'required' | 'cursor' | 'symmetric-hint';

interface GridCellSpec {
  state: CellState;
  letter?: string;
  number?: number;
}

const CELL_BG: Record<CellState, string> = {
  empty: 'bg-grid-empty',
  letter: 'bg-background',
  black: 'bg-foreground',
  required: 'bg-required',
  cursor: 'bg-selected',
  'symmetric-hint': 'bg-background',
};

// The hairline is the container's own background showing through a 1px
// gap -- cells carry no border of their own, so the division between two
// cells is always exactly one pixel of --color-grid-line, regardless of
// what either cell contains.
function GridSample({ cells }: { cells: GridCellSpec[] }) {
  return (
    <div
      data-testid="sg-grid"
      className="grid w-40 grid-cols-3 bg-grid-line"
      style={{ gap: 'var(--grid-line-width)' }}
    >
      {cells.map((cell, index) => (
        <div
          key={index}
          data-testid="sg-cell"
          data-cell-state={cell.state}
          className={`relative flex h-10 w-10 items-center justify-center font-data ${CELL_BG[cell.state]}`}
        >
          {cell.number !== undefined && (
            <span
              data-testid="sg-cell-number"
              className="absolute left-0 top-0 p-[0.1em] text-[0.6em] leading-none text-ink-3"
            >
              {cell.number}
            </span>
          )}
          {cell.letter}
        </div>
      ))}
    </div>
  );
}

const BUILD_CELLS: GridCellSpec[] = [
  { state: 'letter', letter: 'C', number: 1 },
  { state: 'letter', letter: 'A' },
  { state: 'empty' },
  { state: 'cursor' },
  { state: 'symmetric-hint' },
  { state: 'empty' },
];

const PREVIEW_CELLS: GridCellSpec[] = [
  { state: 'letter', letter: 'C', number: 1 },
  { state: 'letter', letter: 'A' },
  { state: 'required' },
  { state: 'black' },
  { state: 'black' },
  { state: 'black' },
];

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6">
      <h1 className="font-display text-3xl font-bold">Style guide</h1>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Tokens</h2>
        <TokenPanel />
      </section>

      <section data-testid="sg-text" className="space-y-2">
        <h2 className="mb-3 font-display text-xl font-semibold">Text</h2>
        <p className="font-display text-2xl">Display heading sample</p>
        <p className="text-base text-foreground">Body text sample, the default reading color.</p>
        <p className="text-sm text-ink-2">Secondary text (ink-2) — captions and metadata.</p>
        <p style={{ fontSize: 'var(--text-eyebrow)' }} className="uppercase text-ink-3">
          Eyebrow text (ink-3)
        </p>
      </section>

      <section data-testid="sg-buttons">
        <h2 className="mb-3 font-display text-xl font-semibold">Buttons</h2>
        {/* sg-hover wraps the interactive elements hover states are
            demonstrated on -- kept as the single primary/disabled button
            on the page, not a duplicate, so the existing unscoped D1-3
            queries and this scoped hover demo resolve to the same
            elements rather than colliding under Playwright's strict mode. */}
        <div data-testid="sg-hover" className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="sg-button-primary"
            className="cursor-pointer rounded-btn bg-accent px-4 py-2 text-white hover:bg-accent-hover"
          >
            Primary
          </button>
          <button
            type="button"
            data-testid="sg-button-quiet"
            className="cursor-pointer rounded-btn border border-rule-strong bg-background px-4 py-2 text-accent hover:bg-hover-tint"
          >
            Quiet
          </button>
          <button
            type="button"
            data-testid="sg-button-disabled"
            disabled
            className="cursor-not-allowed rounded-btn bg-accent px-4 py-2 text-white opacity-50"
          >
            Disabled
          </button>
          <a
            href="#"
            className="cursor-pointer text-accent underline hover:text-accent-hover hover:no-underline"
          >
            Hover link
          </a>
        </div>
      </section>

      <section data-testid="sg-inputs" className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Inputs</h2>
        <input
          data-testid="sg-input"
          type="text"
          placeholder="Type here"
          className="rounded-md border border-rule-strong bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          data-testid="sg-input-focused-example"
          type="text"
          readOnly
          value="Focused example"
          className="rounded-md border border-accent bg-background px-3 py-2 text-foreground ring-2 ring-accent outline-none"
        />
      </section>

      <section data-testid="sg-links">
        <h2 className="mb-2 font-display text-xl font-semibold">Links</h2>
        <a href="#" className="cursor-pointer text-accent underline">
          Example link
        </a>
      </section>

      <section data-testid="sg-hint-rows" className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Hint rows</h2>
        <div
          data-testid="hint-row"
          data-complete="true"
          className="border-l-4 border-accent bg-ok-tint px-3 py-2 text-foreground"
        >
          1 Across — Complete example clue
        </div>
        <div
          data-testid="hint-row"
          data-complete="false"
          className="border-l-4 border-incomplete bg-background px-3 py-2 text-ink-2"
        >
          2 Down — Incomplete example clue
        </div>
      </section>

      <section data-testid="sg-confirmation" className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Confirmation</h2>
        <div className="rounded-md border border-rule-strong bg-panel-tint px-4 py-3">
          <p className="text-foreground">This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-btn bg-accent px-3 py-1 text-white"
            >
              Confirm
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-btn border border-rule-strong px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>

      <section data-testid="sg-error" className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Error</h2>
        <p className="rounded-md border border-required bg-background px-3 py-2 text-required">
          Example error message.
        </p>
      </section>

      <section data-testid="sg-tooltip">
        <h2 className="mb-2 font-display text-xl font-semibold">Tooltip</h2>
        <div className="relative inline-block">
          <button
            type="button"
            className="cursor-pointer rounded-btn border border-rule-strong px-3 py-1 text-sm"
          >
            Hover target
          </button>
          <div className="absolute left-0 top-full z-10 mt-1 rounded-md border border-rule-strong bg-panel-tint px-2 py-1 text-xs text-ink-2 shadow-sm">
            Tooltip example
          </div>
        </div>
      </section>

      <section data-testid="sg-stepper">
        <h2 className="mb-2 font-display text-xl font-semibold">Stepper</h2>
        <ol className="flex items-center gap-2 text-sm">
          {['Grid', 'Hints', 'Published'].map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  index === 0
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white'
                    : 'flex h-6 w-6 items-center justify-center rounded-full border border-rule-strong text-ink-2'
                }
              >
                {index + 1}
              </span>
              <span className={index === 0 ? 'text-foreground' : 'text-ink-2'}>{label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section data-testid="sg-grid-build">
        <h2 className="mb-2 font-display text-xl font-semibold">Grid (build phase)</h2>
        <GridSample cells={BUILD_CELLS} />
      </section>

      <section data-testid="sg-grid-preview">
        <h2 className="mb-2 font-display text-xl font-semibold">Grid (hints-transition preview)</h2>
        <GridSample cells={PREVIEW_CELLS} />
      </section>
    </div>
  );
}
