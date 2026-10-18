'use client';

import { useEffect, useState } from 'react';
import { startPlaySession, type PlayPuzzleView } from '@/app/puzzles/actions';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { slotsWithNumbers } from '@/engine/numbering';
import { deserializeGrid } from '@/lib/puzzle-storage';

export function PlayPuzzle({ initialPuzzle }: { initialPuzzle: PlayPuzzleView }) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [sessionState, setSessionState] = useState<'starting' | 'ready' | 'error'>('starting');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    startPlaySession(initialPuzzle.id).then(
      (started) => {
        if (!active) return;
        setPuzzle(started);
        setSessionState('ready');
      },
      () => {
        if (active) setSessionState('error');
      }
    );
    return () => { active = false; };
  }, [initialPuzzle.id, attempt]);

  const grid = deserializeGrid(puzzle.entries);
  const slots = slotsWithNumbers(grid);

  return (
    <div data-testid="play-puzzle" data-session-state={sessionState} className="p-6">
      <h1 data-testid="play-title" className="mb-6 font-display text-headline font-bold">
        {puzzle.title}
      </h1>
      {sessionState === 'starting' && <p role="status" className="mb-4 text-ink-2">Starting your puzzle…</p>}
      {sessionState === 'error' && (
        <div role="alert" className="mb-4">
          <p>We couldn’t start your puzzle. Please try again.</p>
          <button
            type="button"
            className="mt-2 rounded-btn border border-rule-strong px-4 py-2"
            onClick={() => {
              setSessionState('starting');
              setAttempt((previous) => previous + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex items-start gap-8">
        <div className="w-full max-w-xl shrink-0">
          <PuzzleGrid grid={grid} mode="play" />
        </div>
        <div data-testid="play-clues" className="grid flex-1 grid-cols-2 gap-8">
          {(['across', 'down'] as const).map((orientation) => (
            <section key={orientation} data-testid="play-clue-column" data-orientation={orientation}>
              <h2 className="mb-4 font-display text-body font-bold">
                {orientation === 'across' ? 'Across' : 'Down'}
              </h2>
              <ol className="space-y-3">
                {slots.filter((slot) => slot.orientation === orientation).map((slot) => {
                  const key = `${slot.number}-${orientation}`;
                  return (
                    <li key={key} data-testid="play-clue" data-clue-key={key} className="flex gap-2">
                      <span className="font-bold">{slot.number}</span>{' '}
                      <span>{puzzle.hints[key] ?? ''}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
