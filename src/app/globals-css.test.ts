import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Story F1 — the two color layers, checked in the stylesheet source.
//
// Palette variables are plain custom properties outside @theme, so Tailwind
// generates no utilities from them (no `bg-gray-200` colliding with its
// built-in palette, and components can't use a raw variable). Styles live in
// @theme and reference a variable rather than copying its value. No doubled
// names: the only @theme colors are the old tokens and the new styles. Do not
// edit this file to match an implementation.

const VARIABLES: Record<string, string> = {
  white: '#FFFFFF',
  black: '#000000',
  'gray-200': '#DDE0E6',
  'gray-400': '#BABCBE',
  'gray-500': '#8B909A',
  'gray-600': '#757575',
  'gray-700': '#14151B',
  'interactive-light': '#56B3E5',
  'interactive-medium': '#2191CD',
  'interactive-dark': '#005B8C',
  'interactive-faint': '#F5F7FA',
  'interactive-faint-hover': '#EBEFF7',
  'yellow-bright': '#FCFF4D',
  'yellow-medium': '#FEFFB0',
  'yellow-dull': '#E6E6D1',
  'cell-warning': '#CEB55A',
  'cell-error': '#FF251A',
  'text-error': '#E2655F',
  'blue-bright': '#4BC0FF',
  'blue-medium': '#CFEEFF',
  // 14-S11: the keyboard focus ring.
  cyan: '#00F0FF',
};

const STYLES: Record<string, string> = {
  'build-cell-on': 'white',
  'build-cell-off': 'gray-200',
  'build-cell-border': 'gray-400',
  'build-cell-selected-cell': 'yellow-bright',
  'build-cell-selected-row-on': 'yellow-medium',
  'build-cell-selected-row-off': 'yellow-dull',
  'preview-cell-on': 'white',
  'preview-cell-off': 'gray-700',
  'preview-cell-warning': 'cell-warning',
  'preview-cell-error': 'cell-error',
  'preview-cell-border': 'gray-500',
  'play-cell-on': 'white',
  'play-cell-off': 'gray-700',
  'play-cell-border': 'gray-500',
  'play-cell-selected-cell': 'yellow-bright',
  'play-cell-selected-row': 'blue-medium',
  // 14-S6: the hints phase's own cell styles.
  'hint-cell-on': 'white',
  'hint-cell-off': 'gray-700',
  'hint-cell-border': 'gray-500',
  'hint-cell-selected': 'blue-medium',
  'hint-cell-edit-on': 'white',
  'hint-cell-edit-off': 'gray-200',
  'hint-cell-edit-border': 'gray-400',
  'hint-cell-edit-selected-cell': 'yellow-bright',
  'hint-cell-edit-selected-row': 'yellow-medium',
  primary: 'black',
  muted: 'gray-500',
  'link-muted': 'interactive-light',
  highlight: 'blue-bright',
  error: 'text-error',
  subtle: 'gray-600',
  inverse: 'white',
  'line-muted': 'gray-200',
  'line-highlight': 'blue-bright',
  'line-dark': 'gray-600',
  'fill-muted': 'gray-200',
  'button-fill': 'interactive-light',
  'button-hover': 'interactive-medium',
  'button-active': 'interactive-dark',
  'button-alternate-border': 'gray-500',
  'button-alternate-hover': 'gray-500',
  'puzzle-row': 'interactive-faint',
  'puzzle-row-hover': 'interactive-faint-hover',
  'modal-background': 'white',
  'modal-title-background': 'yellow-bright',
  logo: 'gray-400',
  'logo-cell': 'white',
  masthead: 'white',
  // 14-S11: the keyboard focus ring.
  'focus-ring': 'cyan',
};

const BACKDROP = 'modal-backdrop';

const OLD_COLOR_TOKENS = [
  'background',
  'foreground',
  'ink-2',
  'ink-3',
  'rule',
  'rule-strong',
  'hover-tint',
  'panel-tint',
  'accent',
  'accent-hover',
  'ok-tint',
  'grid-empty',
  'grid-line-build',
  'grid-line-play',
  'cell-fill',
  'selected',
  'slot',
  'slot-content',
  'required',
  'recommended',
  'locked-letter',
  'editable-letter',
  'incomplete',
];

type Declaration = { name: string; value: string; inTheme: boolean };

function declarations(): Declaration[] {
  const source = readFileSync(new URL('./globals.css', import.meta.url), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );

  const themeRanges: [number, number][] = [];
  for (const match of source.matchAll(/@theme\b[^{]*\{/g)) {
    const start = match.index! + match[0].length;
    themeRanges.push([start, source.indexOf('}', start)]);
  }
  const inTheme = (at: number) => themeRanges.some(([s, e]) => at >= s && at < e);

  return Array.from(source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (m) => ({
    name: m[1],
    value: m[2].trim(),
    inTheme: inTheme(m.index!),
  }));
}

describe('F1 palette variables', () => {
  it('declares each variable once, outside @theme, with its hex value', () => {
    const all = declarations();

    for (const [name, hex] of Object.entries(VARIABLES)) {
      const found = all.filter((d) => d.name === `--palette-${name}`);
      expect(found, `--palette-${name}`).toHaveLength(1);
      expect(found[0].inTheme, `--palette-${name} outside @theme`).toBe(false);
      expect(found[0].value.toLowerCase(), `--palette-${name} value`).toBe(hex.toLowerCase());
    }
  });

  it('declares no palette variable inside @theme', () => {
    const leaked = declarations().filter((d) => d.inTheme && d.name.startsWith('--palette-'));
    expect(leaked.map((d) => d.name)).toEqual([]);
  });
});

describe('F1 color styles', () => {
  it('declares each style in @theme as a reference to its variable', () => {
    const all = declarations();

    for (const [style, variable] of Object.entries(STYLES)) {
      const found = all.filter((d) => d.name === `--color-${style}`);
      expect(found, `--color-${style}`).toHaveLength(1);
      expect(found[0].inTheme, `--color-${style} inside @theme`).toBe(true);
      expect(found[0].value, `--color-${style} value`).toBe(`var(--palette-${variable})`);
    }
  });

  it('declares the backdrop as black at 40% through the black variable', () => {
    const found = declarations().filter((d) => d.name === `--color-${BACKDROP}`);
    expect(found).toHaveLength(1);
    expect(found[0].inTheme).toBe(true);
    expect(found[0].value).toContain('var(--palette-black)');
    expect(found[0].value).toMatch(/40%|0?\.4\b/);
    expect(found[0].value).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('has no @theme colors besides the old tokens and the new styles', () => {
    const allowed = new Set(
      [...OLD_COLOR_TOKENS, ...Object.keys(STYLES), BACKDROP].map((n) => `--color-${n}`)
    );
    const extra = declarations().filter(
      (d) => d.inTheme && d.name.startsWith('--color-') && !allowed.has(d.name)
    );
    expect(extra.map((d) => d.name)).toEqual([]);
  });
});
