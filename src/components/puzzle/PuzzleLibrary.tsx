'use client';

import { useEffect, useState } from 'react';
import { NewPuzzleButton } from '@/app/puzzles/NewPuzzleButton';
import { RadioGroup } from '@/components/ui/Radio';
import { Title } from '@/components/ui/Title';
import { groupPuzzles } from '@/lib/puzzle-groups';
import { PuzzleRow, type LibraryPuzzle } from './PuzzleRow';
import { RowHeading } from './RowHeading';

type View = 'build' | 'play';
const VIEW_KEY = 'crossward:library-view';

/** Story 14-S2: the library, split into Build (your puzzles) and Play (every published one). */
export function PuzzleLibrary({ puzzles, userId }: { puzzles: LibraryPuzzle[]; userId: string }) {
  const [view, setView] = useState<View>('build');
  const [ready, setReady] = useState(false);
  // The puzzle just deleted, until its row is gone and the heading has focus.
  const [deletedId, setDeletedId] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(VIEW_KEY);
    } catch {
      // Storage may be blocked; Build is the default.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(stored === 'play' ? 'play' : 'build');
    setReady(true);
  }, []);

  // Focus the heading only once the deleted row has left the list. By then
  // the delete dialog's Modal can no longer return focus to the row's
  // Delete button, so nothing moves focus after this. (A timed focus raced
  // that return and could leave focus on the removed button.)
  useEffect(() => {
    if (deletedId === null || puzzles.some((p) => p.id === deletedId)) return;
    document.getElementById('puzzle-library-heading')?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeletedId(null);
  }, [deletedId, puzzles]);

  function choose(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }

  const shown = view === 'build'
    ? puzzles.filter((p) => p.builderId === userId)
    : puzzles.filter((p) => p.publishedAt !== null);
  const groups = groupPuzzles(shown.map((puzzle) => ({
    puzzle,
    cols: puzzle.cols,
    rows: puzzle.rows,
    phase: puzzle.phase,
    publishedAt: puzzle.publishedAt === null ? null : new Date(puzzle.publishedAt),
    updatedAt: new Date(puzzle.updatedAt),
    // Build doesn't sink completed puzzles.
    play: view === 'play' ? puzzle.play : null,
  })));

  return (
    <div
      data-testid="puzzle-library"
      data-ready={ready}
      className="mx-auto mt-[90px] flex min-h-[630px] w-full max-w-[700px] flex-col border-l border-line-muted pl-5"
    >
      {/* Last-baseline alignment: the Radio's first baseline is its circle, its last is the label text. */}
      <div data-testid="puzzle-list-header" className="flex items-baseline-last justify-between pt-[10px]">
        <Title size={2} as="h1" tabIndex={-1} id="puzzle-library-heading" data-testid="page-heading">Puzzles</Title>
        <RadioGroup
          name="library-view"
          label="Show puzzles"
          variant="nav"
          data-testid="library-view"
          options={[{ value: 'build', label: 'Build' }, { value: 'play', label: 'Play' }]}
          value={view}
          onChange={choose}
        />
      </div>
      <div data-testid="puzzle-list-rule" className="mt-2 h-px bg-line-dark" />
      <div data-testid="puzzle-list" className="mt-5 flex flex-col gap-10">
        {groups.length === 0 && (
          <p data-testid="puzzle-list-empty" className="text-body-normal text-muted">
            {view === 'build' ? "You haven't started a puzzle yet." : 'No puzzles to play yet.'}
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
                  view={view}
                  onDeleted={() => setDeletedId(puzzle.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-5">
        <NewPuzzleButton />
      </div>
    </div>
  );
}
