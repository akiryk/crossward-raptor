'use client';

import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { SizeControl } from './SizeControl';
import { WeightControl } from './WeightControl';

type TabId = 'colors' | 'fonts' | 'utility';

const TABS: { id: TabId; label: string }[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'fonts', label: 'Fonts' },
  { id: 'utility', label: 'Utility' },
];

// Mirrors globals.css's @theme block. No mechanized source of truth ties
// the two together -- Tailwind v4 compiles @theme into CSS at build time,
// there's no runtime token list to read it back from.
const COLOR_TOKENS = [
  '--color-background',
  '--color-foreground',
  '--color-ink-2',
  '--color-ink-3',
  '--color-rule',
  '--color-rule-strong',
  '--color-hover-tint',
  '--color-panel-tint',
  '--color-accent',
  '--color-accent-hover',
  '--color-ok-tint',
  '--color-grid-empty',
  '--color-grid-line',
  '--color-cell-fill',
  '--color-selected',
  '--color-slot',
  '--color-required',
  '--color-incomplete',
];

const SIZE_TOKENS = ['--text-headline', '--text-body', '--text-help', '--text-label'];
const WEIGHT_TOKENS = ['--weight-normal', '--weight-bold'];

function tabButtonClass(isSelected: boolean): string {
  return isSelected
    ? 'cursor-pointer rounded-btn bg-accent px-3 py-1 text-sm text-background'
    : 'cursor-pointer rounded-btn border border-rule-strong px-3 py-1 text-sm text-ink-2';
}

export function TokenPane() {
  const [activeTab, setActiveTab] = useState<TabId>('colors');

  return (
    <div data-testid="token-pane" className="flex flex-col gap-4">
      <h1 className="font-display text-headline [font-weight:var(--weight-bold)]">Style guide</h1>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid="token-tab"
            data-tab-id={tab.id}
            data-selected={activeTab === tab.id ? 'true' : 'false'}
            onClick={() => setActiveTab(tab.id)}
            className={tabButtonClass(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'colors' && (
        <div data-testid="token-tab-panel" data-tab-id="colors" className="flex flex-col">
          {COLOR_TOKENS.map((token) => (
            <ColorPicker key={token} token={token} />
          ))}
        </div>
      )}
      {activeTab === 'fonts' && (
        <div data-testid="token-tab-panel" data-tab-id="fonts" className="flex flex-col">
          {SIZE_TOKENS.map((token) => (
            <SizeControl key={token} token={token} />
          ))}
          {WEIGHT_TOKENS.map((token) => (
            <WeightControl key={token} token={token} />
          ))}
        </div>
      )}
      {activeTab === 'utility' && (
        <div data-testid="token-tab-panel" data-tab-id="utility" className="text-sm text-ink-2">
          Radius, line-width, and font-loading controls are coming in Story D10.
        </div>
      )}
    </div>
  );
}
