'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { inspectPlayCompletion, savePlayEntries, startPlaySession, type PlayPuzzleView } from '@/app/puzzles/actions';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { Modal } from '@/components/ui/Modal';
import { arrowKey, deleteAt, moveTo, place, toggleOrientation, type CursorState } from '@/engine/cursor';
import type { Coord, Grid } from '@/engine/grid';
import { slotsWithNumbers } from '@/engine/numbering';
import { isFull } from '@/engine/play';
import { cellNumberKey } from '@/lib/cell-number-lookup';
import { activeHintKey, buildSlotLookup } from '@/lib/hint-lookup';
import { keyToIntent } from '@/lib/keyboard-intent';
import { deserializeGrid, serializeGrid } from '@/lib/puzzle-storage';
import { createPlayAutosave, type PlaySaveState } from './play-autosave';
import { PlayConfetti } from './PlayConfetti';

export function PlayPuzzle({ initialPuzzle }: { initialPuzzle: PlayPuzzleView }) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [sessionState, setSessionState] = useState<'starting' | 'ready' | 'error'>('starting');
  const [attempt, setAttempt] = useState(0);
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [saveState, setSaveState] = useState<PlaySaveState>('saved');
  const [localWarning, setLocalWarning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [dialog, setDialog] = useState<'incorrect' | 'complete' | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const gridRegion = useRef<HTMLDivElement>(null);
  const autosave = useRef<ReturnType<typeof createPlayAutosave> | null>(null);
  const finishCelebration = useCallback(() => setCelebrating(false), []);

  useEffect(() => {
    let active = true;
    startPlaySession(initialPuzzle.id).then(
      async (started) => {
        if (!active) return;
        if (!started.session) {
          setSessionState('error');
          return;
        }
        // Inspect the authenticated saved grid before touching local recovery:
        // a canonical solved grid must always win over a stale device draft.
        const initialCompletion = isFull(deserializeGrid(started.entries))
          ? await inspectPlayCompletion(started.id) : null;
        if (!active) return;
        const initiallyComplete = initialCompletion?.status === 'complete';
        const serverEntries = initiallyComplete ? initialCompletion.entries : started.entries;
        setSaveState('saved');
        setLocalWarning(false);
        setLocked(initiallyComplete);
        setChecking(false);
        setCompletionError(false);
        setDialog(null);
        setCelebrating(false);
        const saver = createPlayAutosave({
          sessionId: started.session.id,
          serverEntries,
          initiallyComplete,
          save: (entries) => savePlayEntries(started.id, entries),
          onState: setSaveState,
          onLocalWarning: () => setLocalWarning(true),
          completion: {
            inspect: () => inspectPlayCompletion(started.id),
            onPending: setChecking,
            onInspectionError: setCompletionError,
            onIncorrect: () => setDialog('incorrect'),
            onComplete: (result) => {
              setPuzzle((previous) => ({
                ...previous,
                entries: result.entries,
                session: previous.session ? { ...previous.session, completedAt: result.completedAt } : null,
              }));
              setLocked(true);
              setCursor(null);
              setIsFocused(false);
              setCelebrating(true);
              setDialog('complete');
            },
          },
        });
        autosave.current = saver;
        setPuzzle({ ...started, entries: saver.entries });
        setCursor(null);
        setIsFocused(false);
        setSessionState('ready');
      }
    ).catch(() => {
      if (active) setSessionState('error');
    });
    return () => {
      active = false;
      autosave.current?.stop();
      autosave.current = null;
    };
  }, [initialPuzzle.id, attempt]);

  const view = puzzle.id === initialPuzzle.id ? puzzle : initialPuzzle;
  const displayedSessionState = puzzle.id === initialPuzzle.id ? sessionState : 'starting';
  const ready = displayedSessionState === 'ready';
  const editable = ready && !locked && !checking;
  const grid = deserializeGrid(view.entries);
  const slots = slotsWithNumbers(grid);
  const highlights = new Map<string, 'selected' | 'slot'>();
  if (ready && !locked && isFocused && cursor) {
    const lookup = buildSlotLookup(grid);
    const key = activeHintKey(lookup, cursor);
    if (key) {
      for (const coord of lookup.get(key)!.cells) highlights.set(cellNumberKey(coord), 'slot');
    }
    highlights.set(cellNumberKey(cursor.current), 'selected');
  }

  function changeEntries(next: Grid) {
    const entries = serializeGrid(next);
    if (autosave.current?.change(entries)) setPuzzle({ ...puzzle, entries });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || !isFocused || !cursor || event.ctrlKey || event.metaKey || event.altKey
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
    if (!editable || grid.at(coord.col, coord.row).kind !== 'active') return;
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
                {completionError ? 'We couldn’t verify your entries.' : 'We couldn’t save your entries.'}{' '}
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
          {completionError && (
            <p data-testid="play-completion-error" role="alert" className="mt-2">
              Completion verification failed. Retry to check your saved entries before continuing.
            </p>
          )}
          {localWarning && (
            <p data-testid="play-local-save-warning" className="mt-2">
              Pending edits can’t be kept on this device. They may be lost if you leave before saving finishes.
            </p>
          )}
        </div>
      )}
      {ready && locked && (
        <div className="mb-4 flex items-center gap-3">
          <span data-testid="play-completed-mark" role="img" aria-label="Completed" className="text-2xl text-accent">✓</span>
          <p data-testid="play-lock-message" className="text-ink-2">This puzzle is complete. Your entries are read-only.</p>
        </div>
      )}
      <div className="flex items-start gap-8">
        <div
          ref={gridRegion}
          data-testid="play-grid-region"
          data-ready={ready}
          tabIndex={0}
          aria-label="Puzzle entries"
          aria-busy={checking || undefined}
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
      <Modal
        open={dialog === 'incorrect'}
        title="You're so close"
        testId="play-incorrect-dialog"
        onClose={() => setDialog(null)}
      >
        <p>At least one entry is incorrect. Keep going!</p>
      </Modal>
      <Modal
        open={dialog === 'complete'}
        title="Congratulations!"
        testId="play-completion-dialog"
        onClose={() => setDialog(null)}
      >
        <p>You completed the puzzle!</p>
      </Modal>
      {celebrating && <PlayConfetti onFinished={finishCelebration} />}
    </div>
  );
}
