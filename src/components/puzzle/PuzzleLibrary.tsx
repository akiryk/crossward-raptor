'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Title } from '@/components/ui/Title';
import { filterCount, filterPuzzles, filtersQuery, parseFilters, type LibraryFilters as Filters } from '@/lib/puzzle-filters';
import { groupPuzzles } from '@/lib/puzzle-groups';
import { LibraryFilters } from './LibraryFilters';
import { PuzzleRow, type LibraryPuzzle } from './PuzzleRow';
import { RowHeading } from './RowHeading';

/** Story 14-S2: the library. Story 18-S4: one list, narrowed by filters kept in the URL. */
export function PuzzleLibrary({ puzzles, userId }: { puzzles: LibraryPuzzle[]; userId: string }) {
  const filters = parseFilters(useSearchParams());
  const [ready, setReady] = useState(false);
  // The puzzle just deleted, until its row is gone and the heading has focus.
  const [deletedId, setDeletedId] = useState<string | null>(null);

  // data-ready marks hydration, so tests act only once the controls respond.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  // Focus the heading only once the deleted row has left the list. By then
  // the delete dialog's Modal can no longer return focus to the row's
  // menu button, so nothing moves focus after this. (A timed focus raced
  // that return and could leave focus on the removed button.)
  useEffect(() => {
    if (deletedId === null || puzzles.some((p) => p.id === deletedId)) return;
    document.getElementById('puzzle-library-heading')?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeletedId(null);
  }, [deletedId, puzzles]);

  function choose(next: Filters) {
    // Replaces the entry, so Back leaves the library rather than undoing a check.
    window.history.replaceState(null, '', `${window.location.pathname}${filtersQuery(next)}`);
  }

  const shown = filterPuzzles(puzzles, filters, userId);
  const groups = groupPuzzles(shown.map((puzzle) => ({
    puzzle,
    cols: puzzle.cols,
    rows: puzzle.rows,
    phase: puzzle.phase,
    publishedAt: puzzle.publishedAt === null ? null : new Date(puzzle.publishedAt),
    updatedAt: new Date(puzzle.updatedAt),
    play: puzzle.play,
  })));

  return (
    <div
      data-testid="puzzle-library"
      data-ready={ready}
      // From 948px the 200px filters column sits to the left; shifting the list
      // 100px right centers the pair.
      className="relative mx-auto mt-[90px] flex min-h-[630px] w-full max-w-[700px] flex-col border-l border-line-muted pl-5 min-[948px]:left-[100px]"
    >
      <div data-testid="puzzle-list-header" className="pt-[10px]">
        <Title size={2} as="h1" tabIndex={-1} id="puzzle-library-heading" data-testid="page-heading">Puzzles</Title>
      </div>
      <LibraryFilters filters={filters} onChange={choose} />
      <div data-testid="puzzle-list" className="mt-[27px] flex flex-col gap-10">
        {groups.length === 0 && (
          <p data-testid="puzzle-list-empty" className="text-body-normal text-muted">
            {filterCount(filters) > 0 ? 'No puzzles match these filters.' : 'No puzzles yet.'}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.size ?? 'other'} data-testid="puzzle-group" data-size={group.size ?? 'other'}>
            <RowHeading label={group.label} dimensions={group.dimensions} />
            <ul className="mt-[18px] flex flex-col gap-1">
              {group.puzzles.map(({ puzzle }) => (
                <PuzzleRow
                  key={puzzle.id}
                  puzzle={puzzle}
                  own={puzzle.builderId === userId}
                  onDeleted={() => setDeletedId(puzzle.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
