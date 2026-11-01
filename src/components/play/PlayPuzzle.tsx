'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import {
  inspectPlayCompletion, savePlayEntries, startPlaySession, type PlayPuzzleView,
} from '@/app/puzzles/actions';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { arrowKey, deleteAt, moveTo, place, toggleOrientation, type CursorState } from '@/engine/cursor';
import type { Coord, Grid } from '@/engine/grid';
import { slotsWithNumbers } from '@/engine/numbering';
import { isFull } from '@/engine/play';
import { cellNumberKey } from '@/lib/cell-number-lookup';
import { activeHintKey, buildSlotLookup } from '@/lib/hint-lookup';
import { adjacentHintKey, hintOrder } from '@/lib/hint-order';
import { keyToIntent } from '@/lib/keyboard-intent';
import { deserializeGrid, serializeGrid } from '@/lib/puzzle-storage';
import { createPlayAutosave, type PlaySaveState } from './play-autosave';
import { PlayConfetti } from './PlayConfetti';
import { PlayerHints } from './PlayerHints';
import { PlayHintBar } from './PlayHintBar';
import { ProminentHint } from './ProminentHint';

// At most 560px, as the build grid, whatever the window's height (15-S1).
const GRID_MAX_PX = 560;

/**
 * Play opens on the first empty cell in reading order, or the first white
 * cell of a full grid (17-S2).
 */
function openingCursor(grid: Grid): CursorState | null {
  let firstActive: Coord | null = null;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind !== 'active') continue;
      firstActive ??= { col, row };
      if (cell.letter === null) return orient(grid, { col, row });
    }
  }
  return firstActive ? orient(grid, firstActive) : null;
}

/** Across, or Down where the cell has no Across word (17-S2). */
function orient(grid: Grid, coord: Coord): CursorState {
  const lookup = buildSlotLookup(grid);
  const across = { current: coord, orientation: 'across' as const };
  return activeHintKey(lookup, across) ? across : { current: coord, orientation: 'down' };
}

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
  const [unavailable, setUnavailable] = useState(false);
  const gridRegion = useRef<HTMLDivElement>(null);
  const autosave = useRef<ReturnType<typeof createPlayAutosave> | null>(null);
  // Identifies the mounted start run; late results of a replaced run are ignored.
  const currentRun = useRef<object | null>(null);
  const finishCelebration = useCallback(() => setCelebrating(false), []);

  /** Shows an authenticated attempt from a start with a new save workflow. */
  const beginSession = useCallback(async (started: PlayPuzzleView, isCurrent: () => boolean) => {
    if (!isCurrent()) return;
    if (!started.session) {
      setSessionState('error');
      return;
    }
    // Inspect the authenticated saved grid before touching local recovery:
    // a canonical solved grid must always win over a stale device draft.
    const initialCompletion = isFull(deserializeGrid(started.entries))
      ? await inspectPlayCompletion(started.id) : null;
    if (!isCurrent()) return;
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
    const opening = initiallyComplete ? null : openingCursor(deserializeGrid(saver.entries));
    setCursor(opening);
    setIsFocused(false);
    setSessionState('ready');
    // Focused at once, so the word and its hint show and typing works,
    // without scrolling the page (17-S2).
    if (opening) gridRegion.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const run = {};
    currentRun.current = run;
    const isCurrent = () => currentRun.current === run;
    startPlaySession(initialPuzzle.id).then((started) => beginSession(started, isCurrent)).catch(() => {
      if (isCurrent()) setSessionState('error');
    });
    return () => {
      if (currentRun.current === run) currentRun.current = null;
      autosave.current?.stop();
      autosave.current = null;
    };
  }, [initialPuzzle.id, attempt, beginSession]);

  const view = puzzle.id === initialPuzzle.id ? puzzle : initialPuzzle;
  const displayedSessionState = puzzle.id === initialPuzzle.id ? sessionState : 'starting';
  const ready = displayedSessionState === 'ready';
  const editable = ready && !locked && !checking && !unavailable;

  useEffect(() => {
    if (saveState !== 'error') return;
    let current = true;
    fetch(`/puzzles/${initialPuzzle.id}/play`, { cache: 'no-store' }).then((response) => {
      if (current && response.status === 404) {
        autosave.current?.stop();
        setUnavailable(true);
      }
    }).catch(() => undefined);
    return () => { current = false; };
  }, [saveState, initialPuzzle.id]);
  const grid = deserializeGrid(view.entries);
  const slots = slotsWithNumbers(grid);
  const lookup = buildSlotLookup(grid);
  const highlights = new Map<string, 'selected' | 'slot'>();
  let selectedKey: string | null = null;
  if (ready && !locked && isFocused && cursor) {
    selectedKey = activeHintKey(lookup, cursor);
    if (selectedKey) {
      for (const coord of lookup.get(selectedKey)!.cells) highlights.set(cellNumberKey(coord), 'slot');
    }
    highlights.set(cellNumberKey(cursor.current), 'selected');
  }
  const selectedSlot = selectedKey ? lookup.get(selectedKey)! : null;
  const gridWidth = `${GRID_MAX_PX}px`;
  // Narrow, only the messages that need attention show above the grid
  // (15-S5), 16px from it.
  const narrowMessage = displayedSessionState !== 'ready'
    || saveState === 'error' || completionError || localWarning || locked;

  function changeEntries(next: Grid) {
    const entries = serializeGrid(next);
    if (autosave.current?.change(entries)) setPuzzle({ ...puzzle, entries });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || !isFocused || !cursor || event.ctrlKey || event.metaKey || event.altKey
      || event.nativeEvent.isComposing) return;
    const intent = keyToIntent(event.key);
    if (!intent) return;
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

  // A click on a Player Hint selects its word: the cursor goes to the word's
  // first empty cell, or its first cell when it's full (14-S7).
  function handleHintClick(key: string) {
    const slot = lookup.get(key);
    if (!editable || !slot) return;
    const empty = slot.cells.find((coord) => {
      const cell = grid.at(coord.col, coord.row);
      return cell.kind === 'active' && cell.letter === null;
    });
    gridRegion.current?.focus();
    setIsFocused(true);
    setCursor({ current: empty ?? slot.cells[0], orientation: slot.orientation });
  }

  // The hint bar's arrows step from the cursor's word, even once the grid
  // has lost focus to the arrow; with no word there, Next goes to the first
  // word and Previous to the last (15-S5).
  function handleStep(step: 1 | -1) {
    const key = cursor ? activeHintKey(lookup, cursor) : null;
    const order = hintOrder(lookup);
    const target = key ? adjacentHintKey(lookup, key, step) : order.at(step === 1 ? 0 : -1);
    if (target) handleHintClick(target);
  }

  function handleCellClick(coord: Coord) {
    if (!editable || grid.at(coord.col, coord.row).kind !== 'active') return;
    gridRegion.current?.focus();
    setIsFocused(true);
    setCursor(cursor ? moveTo(grid, cursor, coord) : { current: coord, orientation: 'across' });
  }

  return (
    <div data-testid="play-puzzle" data-session-state={displayedSessionState} className="p-6">
      {/* Narrow below 1242px of room (a 1290px window): no title, controls
          or hint lists, and the hint bar under the grid (15-S5). Both
          arrangements are rendered and the container query picks one. */}
      <div className="@container/play">
        <h1 data-testid="play-title" className="mb-8 hidden text-title-1 text-primary @min-[1242px]/play:block">
          {view.title}
        </h1>
        <div
          className={`mx-auto flex max-w-(--play-grid-width) flex-col gap-3 @min-[1242px]/play:mb-0 @min-[1242px]/play:block @min-[1242px]/play:max-w-none ${narrowMessage ? 'mb-4' : ''}`}
          style={{ ['--play-grid-width' as string]: gridWidth }}
        >
          <div className="contents @min-[1242px]/play:flex @min-[1242px]/play:h-8 @min-[1242px]/play:items-center @min-[1242px]/play:gap-3">
            {ready && unavailable && (
              <p data-testid="play-unavailable" role="alert" className="text-body-small text-error @min-[1242px]/play:ml-auto">
                This puzzle is no longer available.{' '}
                <Link href="/puzzles" className="text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover">Back to puzzles</Link>
              </p>
            )}
            {ready && !unavailable && (
              <div
                data-testid="play-save-status"
                data-save-state={saveState}
                role={saveState === 'error' ? 'alert' : 'status'}
                className={`text-body-small @min-[1242px]/play:ml-auto ${
                  saveState === 'error' ? 'text-error' : 'hidden text-muted @min-[1242px]/play:block'
                }`}
              >
                {saveState === 'saved' && 'Saved'}
                {saveState === 'pending' && 'Waiting to save…'}
                {saveState === 'saving' && 'Saving…'}
                {saveState === 'error' && (
                  <>
                    {completionError ? 'We couldn’t verify your entries.' : 'We couldn’t save your entries.'}{' '}
                    <button
                      type="button"
                      className="cursor-pointer text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover"
                      onClick={() => autosave.current?.retry()}
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {displayedSessionState === 'starting' && (
            <p role="status" className="@min-[1242px]/play:mt-3 text-body-normal text-muted">Starting your puzzle…</p>
          )}
          {displayedSessionState === 'error' && (
            <div role="alert" className="@min-[1242px]/play:mt-3 space-y-3">
              <p className="text-body-normal text-error">We couldn’t start your puzzle. Please try again.</p>
              <Button
                onClick={() => {
                  setSessionState('starting');
                  setAttempt((previous) => previous + 1);
                }}
              >
                Retry
              </Button>
            </div>
          )}
          {ready && completionError && !unavailable && (
            <p data-testid="play-completion-error" role="alert" className="@min-[1242px]/play:mt-3 text-body-small text-error">
              Completion verification failed. Retry to check your saved entries before continuing.
            </p>
          )}
          {ready && localWarning && (
            <p data-testid="play-local-save-warning" className="@min-[1242px]/play:mt-3 text-body-small text-muted">
              Pending edits can’t be kept on this device. They may be lost if you leave before saving finishes.
            </p>
          )}
          {ready && locked && (
            <div className="@min-[1242px]/play:mt-3 flex items-center gap-2">
              <span data-testid="play-completed-mark" role="img" aria-label="Completed" className="text-title-3 text-highlight">✓</span>
              <p data-testid="play-lock-message" className="text-body-normal text-primary">
                This puzzle is complete. Your entries are read-only.
              </p>
            </div>
          )}
        </div>
        <div
          className="mx-auto max-w-(--play-grid-width) @min-[1242px]/play:mt-[27px] @min-[1242px]/play:grid @min-[1242px]/play:max-w-none @min-[1242px]/play:grid-cols-[var(--play-grid-width)_minmax(0,1fr)] @min-[1242px]/play:gap-x-[26px] @min-[1242px]/play:gap-y-4"
          style={{ ['--play-grid-width' as string]: gridWidth }}
        >
          <div className="hidden w-full max-w-(--play-grid-width) @min-[1242px]/play:block">
            <ProminentHint
              label={selectedSlot ? `${selectedSlot.number}${selectedSlot.orientation === 'across' ? 'A' : 'D'}` : null}
              hint={selectedKey ? view.hints[selectedKey] ?? '' : ''}
            />
          </div>
          <div
            ref={gridRegion}
            data-testid="play-grid-region"
            data-ready={ready}
            tabIndex={0}
            aria-label="Puzzle entries"
            aria-busy={checking || undefined}
            className="w-full max-w-(--play-grid-width) outline-none @min-[1242px]/play:col-start-1 @min-[1242px]/play:row-start-2"
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <PuzzleGrid grid={grid} mode="play" highlights={highlights} onCellClick={handleCellClick} />
          </div>
          {/* Beside the grid, the lists scroll in their own box at the grid's
              height (15-S1): a zero height grown to the row's keeps them from
              stretching it. */}
          <div
            data-testid="play-clues"
            className="hidden min-w-0 overflow-y-auto @min-[1242px]/play:col-start-2 @min-[1242px]/play:row-start-2 @min-[1242px]/play:block @min-[1242px]/play:h-0 @min-[1242px]/play:min-h-full"
          >
            <PlayerHints slots={slots} hints={view.hints} selectedKey={selectedKey} onSelect={handleHintClick} />
          </div>
          <div className="@min-[1242px]/play:hidden">
            <PlayHintBar
              hint={selectedKey ? view.hints[selectedKey] ?? '' : ''}
              disabled={!editable}
              onStep={handleStep}
            />
          </div>
        </div>
      </div>
      <Modal
        open={dialog === 'incorrect'}
        title="You're so close"
        testId="play-incorrect-dialog"
        onClose={() => setDialog(null)}
        footer={
          <Button data-testid="play-incorrect-ok" onClick={() => setDialog(null)}>
            OK
          </Button>
        }
      >
        <p>At least one entry is incorrect. Keep going!</p>
      </Modal>
      <Modal
        open={dialog === 'complete'}
        title="Congratulations!"
        testId="play-completion-dialog"
        onClose={() => setDialog(null)}
        footer={
          <Button data-testid="play-completion-ok" onClick={() => setDialog(null)}>
            OK
          </Button>
        }
      >
        <p>You completed the puzzle!</p>
      </Modal>
      {celebrating && <PlayConfetti onFinished={finishCelebration} />}
    </div>
  );
}
