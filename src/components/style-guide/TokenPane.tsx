'use client';

import { useEffect, useRef, useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { SizeControl } from './SizeControl';
import { WeightControl } from './WeightControl';
import { UtilityControl } from './UtilityControl';
import { FontLoader } from './FontLoader';

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
  '--color-grid-line-build',
  '--color-grid-line-play',
  '--color-cell-fill',
  '--color-selected',
  '--color-slot',
  '--color-slot-content',
  '--color-required',
  '--color-recommended',
  '--color-locked-letter',
  '--color-editable-letter',
  '--color-incomplete',
];

const SIZE_TOKENS = ['--text-headline', '--text-body', '--text-help', '--text-label'];
const WEIGHT_TOKENS = ['--weight-normal', '--weight-bold'];
const FONT_TOKENS = ['--font-display', '--font-body', '--font-data'];
const UTILITY_TOKENS = [
  '--radius-btn',
  '--radius-md',
  '--radius-lg',
  '--radius-grid',
  '--grid-line-width',
];

/**
 * A select per font-family token, listing any families loaded via
 * FontLoader. Selecting one writes straight to
 * document.documentElement.style, same as every other control here.
 * Uncontrolled (a ref, not value/onChange) for the same reason as
 * ColorPicker/SizeControl/WeightControl.
 */
function FontFamilyControl({
  token,
  loadedFamilies,
}: {
  token: string;
  loadedFamilies: readonly string[];
}) {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    function handleChange() {
      const family = select!.value;
      if (family === '') {
        document.documentElement.style.removeProperty(token);
      } else {
        document.documentElement.style.setProperty(token, `"${family}", system-ui, sans-serif`);
      }
    }

    select.addEventListener('change', handleChange);
    return () => select.removeEventListener('change', handleChange);
  }, [token]);

  return (
    <div
      data-testid="font-family-control"
      data-token-name={token}
      className="flex items-center gap-3 border-b border-rule py-2"
    >
      <select
        ref={selectRef}
        data-testid="font-family-select"
        defaultValue=""
        className="cursor-pointer rounded-md border border-rule-strong bg-background px-2 py-1"
      >
        <option value="">Current</option>
        {loadedFamilies.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </select>
      <span className="font-data text-label text-ink-2">{token}</span>
    </div>
  );
}

function tabButtonClass(isSelected: boolean): string {
  return isSelected
    ? 'cursor-pointer rounded-btn bg-accent px-3 py-1 text-sm text-background'
    : 'cursor-pointer rounded-btn border border-rule-strong px-3 py-1 text-sm text-ink-2';
}

export function TokenPane() {
  const [activeTab, setActiveTab] = useState<TabId>('colors');
  const [loadedFamilies, setLoadedFamilies] = useState<string[]>([]);

  function handleFontLoaded(families: readonly string[]) {
    setLoadedFamilies((prev) => {
      const merged = [...prev];
      for (const family of families) {
        if (!merged.includes(family)) merged.push(family);
      }
      return merged;
    });
  }

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
          <FontLoader onLoaded={handleFontLoaded} />
          {FONT_TOKENS.map((token) => (
            <FontFamilyControl key={token} token={token} loadedFamilies={loadedFamilies} />
          ))}
        </div>
      )}
      {activeTab === 'utility' && (
        <div data-testid="token-tab-panel" data-tab-id="utility" className="flex flex-col">
          {UTILITY_TOKENS.map((token) => (
            <UtilityControl key={token} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
