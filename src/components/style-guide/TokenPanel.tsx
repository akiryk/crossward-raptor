type TokenKind = 'font' | 'color' | 'radius' | 'size';

interface TokenEntry {
  name: string;
  kind: TokenKind;
}

// Mirrors globals.css's @theme block. No mechanized source of truth ties
// the two together -- Tailwind v4 compiles @theme into CSS at build time,
// there's no runtime token list to read it back from.
const TOKENS: TokenEntry[] = [
  { name: '--font-display', kind: 'font' },
  { name: '--font-body', kind: 'font' },
  { name: '--font-data', kind: 'font' },
  { name: '--color-background', kind: 'color' },
  { name: '--color-foreground', kind: 'color' },
  { name: '--color-ink-2', kind: 'color' },
  { name: '--color-ink-3', kind: 'color' },
  { name: '--color-rule', kind: 'color' },
  { name: '--color-rule-strong', kind: 'color' },
  { name: '--color-hover-tint', kind: 'color' },
  { name: '--color-panel-tint', kind: 'color' },
  { name: '--color-accent', kind: 'color' },
  { name: '--color-accent-hover', kind: 'color' },
  { name: '--color-ok-tint', kind: 'color' },
  { name: '--color-grid-empty', kind: 'color' },
  { name: '--color-grid-line', kind: 'color' },
  { name: '--color-cell-fill', kind: 'color' },
  { name: '--color-selected', kind: 'color' },
  { name: '--color-required', kind: 'color' },
  { name: '--color-complete', kind: 'color' },
  { name: '--color-incomplete', kind: 'color' },
  { name: '--radius-btn', kind: 'radius' },
  { name: '--radius-md', kind: 'radius' },
  { name: '--radius-lg', kind: 'radius' },
  { name: '--radius-grid', kind: 'radius' },
  { name: '--grid-line-width', kind: 'size' },
  { name: '--text-eyebrow', kind: 'size' },
];

function TokenPreview({ token }: { token: TokenEntry }) {
  if (token.kind === 'color') {
    return (
      <span
        aria-hidden
        className="inline-block h-6 w-6 rounded-md border border-rule-strong"
        style={{ backgroundColor: `var(${token.name})` }}
      />
    );
  }
  if (token.kind === 'font') {
    return <span style={{ fontFamily: `var(${token.name})` }}>Ag</span>;
  }
  if (token.kind === 'radius') {
    return (
      <span
        aria-hidden
        className="inline-block h-6 w-10 border border-rule-strong bg-panel-tint"
        style={{ borderRadius: `var(${token.name})` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-block h-6 w-10 border-t border-grid-line"
      style={{ borderTopWidth: token.name === '--grid-line-width' ? `var(${token.name})` : undefined }}
    />
  );
}

export function TokenPanel() {
  return (
    <div data-testid="token-panel" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TOKENS.map((token) => (
        <div
          key={token.name}
          data-testid="token-row"
          data-token-name={token.name}
          className="flex items-center gap-3 border-b border-rule py-2"
        >
          <TokenPreview token={token} />
          <span className="font-data text-sm text-ink-2">{token.name}</span>
        </div>
      ))}
    </div>
  );
}
