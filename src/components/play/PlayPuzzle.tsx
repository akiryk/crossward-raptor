'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { savePlayEntries, startPlaySession, type PlayPuzzleView } from '@/app/puzzles/actions';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { arrowKey, deleteAt, moveTo, place, toggleOrientation, type CursorState } from '@/engine/cursor';
import type { Coord, Grid } from '@/engine/grid';
import { slotsWithNumbers } from '@/engine/numbering';
import { cellNumberKey } from '@/lib/cell-number-lookup';
import { activeHintKey, buildSlotLookup } from '@/lib/hint-lookup';
import { keyToIntent } from '@/lib/keyboard-intent';
import { deserializeGrid, serializeGrid } from '@/lib/puzzle-storage';
import { createPlayAutosave, type PlaySaveState } from './play-autosave';

export function PlayPuzzle({ initialPuzzle }: { initialPuzzle: PlayPuzzleView }) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [sessionState, setSessionState] = useState<'starting' | 'ready' | 'error'>('starting');
  const [attempt, setAttempt] = useState(0);
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [saveState, setSaveState] = useState<PlaySaveState>('saved');
  const [localWarning, setLocalWarning] = useState(false);
  const gridRegion = useRef<HTMLDivElement>(null);
  const autosave = useRef<ReturnType<typeof createPlayAutosave> | null>(null);

  useEffect(() => {
    let active = true;
    startPlaySession(initialPuzzle.id).then(
      (started) => {
        if (!active) return;
        if (!started.session) {
          setSessionState('error');
          return;
        }
        setSaveState('saved');
        setLocalWarning(false);
        const saver = createPlayAutosave({
          sessionId: started.session.id,
          serverEntries: started.entries,
          save: (entries) => savePlayEntries(started.id, entries),
          onState: setSaveState,
          onLocalWarning: () => setLocalWarning(true),
        });
        autosave.current = saver;
        setPuzzle({ ...started, entries: saver.entries });
        setCursor(null);
        setIsFocused(false);
        setSessionState('ready');
      },
      () => {
        if (active) setSessionState('error');
      }
    );
    return () => {
      active = false;
      autosave.current?.stop();
      autosave.current = null;
    };
  }, [initialPuzzle.id, attempt]);

  const view = puzzle.id === initialPuzzle.id ? puzzle : initialPuzzle;
  const displayedSessionState = puzzle.id === initialPuzzle.id ? sessionState : 'starting';
  const ready = displayedSessionState === 'ready';
  const grid = deserializeGrid(view.entries);
  const slots = slotsWithNumbers(grid);
  const highlights = new Map<string, 'selected' | 'slot'>();
  if (ready && isFocused && cursor) {
    const lookup = buildSlotLookup(grid);
    const key = activeHintKey(lookup, cursor);
    if (key) {
      for (const coord of lookup.get(key)!.cells) highlights.set(cellNumberKey(coord), 'slot');
    }
    highlights.set(cellNumberKey(cursor.current), 'selected');
  }

  function changeEntries(next: Grid) {
    const entries = serializeGrid(next);
    autosave.current?.change(entries);
    setPuzzle({ ...puzzle, entries });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!ready || !isFocused || !cursor || event.ctrlKey || event.metaKey || event.altKey
      || event.nativeEvent.isComposing) return;
    const intent = keyToIntent(event.key);
    if (!intent || intent.type === 'toggleBlack') return;
    event.preventDefault();
    if (intent.type === 'letter' || intent.type === 'delete') {
      const result = intent.type === 'letter'
        ? place(grid, cursor, intent.letter) : deleteAt(grid, cursor);
      changeEntries(result.grid);
      setCursor(result.cursor);
    } else if (intent.type === 'arrow') {
      setCursor(arrowKey(grid, cursor, intent.direction));
    } else {
      setCursor(toggleOrientation(cursor));
    }
  }

  function handleCellClick(coord: Coord) {
    if (!ready || grid.at(coord.col, coord.row).kind !== 'active') return;
    gridRegion.current?.focus();
    setIsFocused(true);
    setCursor(cursor ? moveTo(grid, cursor, coord) : { current: coord, orientation: 'across' });
  }

  return (
    <div data-testid="play-puzzle" data-session-state={displayedSessionState} className="p-6">
      <h1 data-testid="play-title" className="mb-6 font-display text-headline font-bold">
        {view.title}
      </h1>
      {displayedSessionState === 'starting' && <p role="status" className="mb-4 text-ink-2">Starting your puzzle…</p>}
      {displayedSessionState === 'error' && (
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
      {ready && (
        <div className="mb-4 text-help text-ink-2">
          <div
            data-testid="play-save-status"
            data-save-state={saveState}
            role={saveState === 'error' ? 'alert' : 'status'}
          >
            {saveState === 'saved' && 'Saved'}
            {saveState === 'pending' && 'Waiting to save…'}
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'error' && (
              <>
                We couldn’t save your entries.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => autosave.current?.retry()}
                >
                  Retry
                </button>
              </>
            )}
          </div>
          {localWarning && (
            <p data-testid="play-local-save-warning" className="mt-2">
              Pending edits can’t be kept on this device. They may be lost if you leave before saving finishes.
            </p>
          )}
        </div>
      )}
      <div className="flex items-start gap-8">
        <div
          ref={gridRegion}
          data-testid="play-grid-region"
          data-ready={ready}
          tabIndex={0}
          aria-label="Puzzle entries"
          className="w-full max-w-xl shrink-0 outline-none"
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <PuzzleGrid grid={grid} mode="play" highlights={highlights} onCellClick={handleCellClick} />
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
                      <span>{view.hints[key] ?? ''}</span>
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
