import { TokenPanel } from '@/components/style-guide/TokenPanel';

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

      <section data-testid="sg-buttons" className="flex flex-wrap items-center gap-3">
        <h2 className="w-full font-display text-xl font-semibold">Buttons</h2>
        <button
          type="button"
          data-testid="sg-button-primary"
          className="cursor-pointer rounded-btn bg-accent px-4 py-2 text-white"
        >
          Primary
        </button>
        <button
          type="button"
          data-testid="sg-button-quiet"
          className="cursor-pointer rounded-btn border border-rule-strong bg-background px-4 py-2 text-accent"
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
          className="border-l-4 border-complete bg-ok-tint px-3 py-2 text-foreground"
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
        <div className="grid w-40 grid-cols-3" style={{ gap: 'var(--grid-line-width)' }}>
          <div className="aspect-square border border-grid-line bg-cell-fill" />
          <div className="aspect-square border border-grid-line bg-grid-empty" />
          <div className="aspect-square border border-grid-line bg-foreground" />
          <div className="aspect-square border border-grid-line bg-grid-empty" />
          <div className="aspect-square border border-grid-line bg-selected" />
          <div className="aspect-square border border-grid-line bg-grid-empty" />
          <div className="aspect-square border border-grid-line bg-grid-empty" />
          <div className="aspect-square border border-grid-line bg-grid-empty" />
          <div className="aspect-square border border-grid-line bg-cell-fill" />
        </div>
      </section>

      <section data-testid="sg-grid-preview">
        <h2 className="mb-2 font-display text-xl font-semibold">Grid (hints-transition preview)</h2>
        <div className="grid w-40 grid-cols-3" style={{ gap: 'var(--grid-line-width)' }}>
          <div className="aspect-square border border-grid-line bg-cell-fill" />
          <div className="aspect-square border border-grid-line bg-required" />
          <div className="aspect-square border border-grid-line bg-foreground" />
          <div className="aspect-square border border-grid-line bg-required" />
          <div className="aspect-square border border-grid-line bg-selected" />
          <div className="aspect-square border border-grid-line bg-foreground" />
          <div className="aspect-square border border-grid-line bg-foreground" />
          <div className="aspect-square border border-grid-line bg-foreground" />
          <div className="aspect-square border border-grid-line bg-cell-fill" />
        </div>
      </section>
    </div>
  );
}
