'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { NewPuzzleButton } from '@/app/puzzles/NewPuzzleButton';
import { Checkbox } from '@/components/ui/Checkbox';
import { Title } from '@/components/ui/Title';
import {
  CREATE_FILTERS,
  PLAY_FILTERS,
  NO_FILTERS,
  SIZE_FILTERS,
  filterCount,
  type LibraryFilters as Filters,
} from '@/lib/puzzle-filters';

const GROUPS = [
  { key: 'play', legend: 'Play', options: PLAY_FILTERS, labels: { unplayed: 'Unplayed', underway: 'Underway', complete: 'Complete' } },
  { key: 'create', legend: 'Create', options: CREATE_FILTERS, labels: { build: 'Build Phase', hint: 'Hint Phase', unlisted: 'Unlisted' } },
  { key: 'size', legend: 'Size', options: SIZE_FILTERS, labels: { mini: 'Mini', midi: 'Midi', daily: 'Daily', sunday: 'Sunday' } },
] as const;

const LINK = 'cursor-pointer text-title-4 text-link-muted outline-none transition-colors duration-150 ease-out hover:text-button-hover focus-visible:text-button-hover';

/** Story 18-S4: Create A Puzzle and the filters. On desktop, the left
 *  column; narrower, a row with a Filters button that opens the panel. */
export function LibraryFilters({ filters, onChange }: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const count = filterCount(filters);

  function set(key: keyof Filters, value: string, checked: boolean) {
    const current = filters[key] as string[];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    onChange({ ...filters, [key]: next });
  }

  function reset() {
    onChange(NO_FILTERS);
    // The button disappears; focus the label it sat beside.
    document.getElementById('puzzle-filters-heading')?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !open) return;
    setOpen(false);
    toggle.current?.focus();
  }

  // Desktop: a 200px column left of the list column's hairline, its top level
  // with the list (the heading's 10px inset, its 40px line and the 27px gap).
  return (
    <div
      data-testid="puzzle-filters-column"
      onKeyDown={onKeyDown}
      className="mt-[27px] min-[948px]:absolute min-[948px]:top-[77px] min-[948px]:right-[calc(100%+1px)] min-[948px]:mt-0 min-[948px]:w-[200px]"
    >
      <div className="flex items-center justify-between">
        <NewPuzzleButton />
        <button
          ref={toggle}
          type="button"
          data-testid="puzzle-filters-toggle"
          aria-expanded={open}
          aria-controls="puzzle-filters"
          onClick={() => setOpen(!open)}
          className={`${LINK} min-[948px]:hidden`}
        >
          {count > 0 ? `Filters · ${count}` : 'Filters'}
        </button>
      </div>
      <div
        id="puzzle-filters"
        data-testid="puzzle-filters"
        className={`${open ? 'block' : 'hidden'} mt-4 pl-[6px] min-[948px]:mt-5 min-[948px]:block`}
      >
        <div className="flex items-center gap-3">
          <Title size={4} as="h2" tabIndex={-1} id="puzzle-filters-heading" data-testid="puzzle-filters-heading">Filters</Title>
          {count > 0 && (
            <button type="button" data-testid="puzzle-filters-reset" onClick={reset} className={LINK}>
              Reset
            </button>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-10 gap-y-[26px] min-[948px]:flex-col">
          {GROUPS.map((group) => (
            <fieldset key={group.key} data-testid="puzzle-filter-group" data-group={group.key}>
              <legend className="text-title-4 text-primary">{group.legend}</legend>
              <div className="mt-[14px] flex flex-col gap-[13px]">
                {group.options.map((option) => (
                  <Checkbox
                    key={option}
                    name={group.key}
                    value={option}
                    label={(group.labels as Record<string, string>)[option]}
                    checked={(filters[group.key] as string[]).includes(option)}
                    onChange={(checked) => set(group.key, option, checked)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    </div>
  );
}
