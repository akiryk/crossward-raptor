'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import {
  inspectPlayCompletion, resetPlaySession, savePlayEntries, startPlaySession, type PlayPuzzleView,
} from '@/app/puzzles/actions';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { deleteAt, place, type CursorState } from '@/engine/cursor';
import type { Coord, Grid } from '@/engine/grid';
import { slotsWithNumbers } from '@/engine/numbering';
import { isFull } from '@/engine/play';
import { cellNumberKey } from '@/lib/cell-number-lookup';
import { activeHintKey, buildSlotLookup } from '@/lib/hint-lookup';
import { adjacentHintKey, hintOrder } from '@/lib/hint-order';
import { keyToIntent } from '@/lib/keyboard-intent';
import { deserializeGrid, serializeGrid } from '@/lib/puzzle-storage';
import { wordArrowKey, wordMoveTo, wordStart, wordToggle } from '@/lib/word-cursor';
import { RebusControl } from '@/components/grid/RebusControl';
import { closeRebus, rebusIntent } from '@/lib/rebus-entry';
import { createPlayAutosave, playDraftKey, type PlaySaveState } from './play-autosave';
import { PlayConfetti } from './PlayConfetti';
import { PlayerHints } from './PlayerHints';
import { PlayHintBar } from './PlayHintBar';
import { PlayResetDialog } from './PlayReset';
import { ProminentHint } from './ProminentHint';

// At most 700px (17-S7), as the build grid, whatever the window's height (15-S1).
const GRID_MAX_PX = 700;

// A link, as the library filters' Reset (18-S4), at the message's size (19-S1).
const RESET_LINK = 'cursor-pointer text-body-normal text-link-muted outline-none transition-colors duration-150 ease-out hover:text-button-hover focus-visible:text-button-hover';

/**
 * Play opens on the first empty cell in reading order, or the first white
 * cell of a full grid, Across or Down where it has no Across word (17-S2).
 */
function openingCursor(grid: Grid): CursorState | null {
  let firstActive: Coord | null = null;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind !== 'active') continue;
      firstActive ??= { col, row };
      if (cell.letter === null) return wordStart(grid, { col, row });
    }
  }
  return firstActive ? wordStart(grid, firstActive) : null;
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
  const [rebusValue, setRebusValue] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const resetBusy = useRef(false);
  const rebusOpenRef = useRef(false);
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
  // A completed puzzle has no controls row ("Saved") unless it has
  // something to report (19-S1).
  const controlsRow = !locked || unavailable || saveState === 'error';

  function cancelReset() {
    if (resetBusy.current) return;
    setResetOpen(false);
    setResetFailed(false);
  }

  /** Replaces the completed attempt with a blank one and plays it (19-S1). */
  async function confirmReset() {
    const sessionId = view.session?.id;
    if (resetBusy.current || !sessionId) return;
    resetBusy.current = true;
    setResetPending(true);
    setResetFailed(false);
    let started: PlayPuzzleView;
    try {
      started = await resetPlaySession(view.id, sessionId);
    } catch {
      setResetFailed(true);
      return;
    } finally {
      resetBusy.current = false;
      setResetPending(false);
    }
    try {
      localStorage.removeItem(playDraftKey(sessionId));
    } catch {
      // The new session ID already prevents recovering the obsolete draft.
    }
    const run = currentRun.current;
    autosave.current?.stop();
    setResetOpen(false);
    await beginSession(started, () => run !== null && currentRun.current === run);
  }

  function changeEntries(next: Grid) {
    const entries = serializeGrid(next);
    if (autosave.current?.change(entries)) setPuzzle({ ...puzzle, entries });
  }

  function openRebus() {
    if (!editable || !cursor) return;
    const cell = grid.at(cursor.current.col, cursor.current.row);
    rebusOpenRef.current = true;
    setRebusValue(cell.kind === 'active' ? cell.letter ?? '' : '');
  }

  function closeRebusEntry(advance: boolean) {
    if (!rebusOpenRef.current) return;
    rebusOpenRef.current = false;
    const text = rebusValue ?? '';
    setRebusValue(null);
    if (!cursor) return;
    const result = closeRebus(grid, cursor, text, { advance, canClear: true });
    if (result.grid !== grid) changeEntries(result.grid);
    setCursor(result.cursor);
    if (advance) gridRegion.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || !isFocused || !cursor || event.ctrlKey || event.metaKey || event.altKey
      || event.nativeEvent.isComposing) return;
    if (rebusValue === null && rebusIntent(event.key, false) === 'open') {
      event.preventDefault();
      openRebus();
      return;
    }
    const intent = keyToIntent(event.key);
    if (!intent) return;
    event.preventDefault();
    if (intent.type === 'letter' || intent.type === 'delete') {
      const result = intent.type === 'letter'
        ? place(grid, cursor, intent.letter) : deleteAt(grid, cursor);
      changeEntries(result.grid);
      setCursor(result.cursor);
    } else if (intent.type === 'arrow') {
      setCursor(wordArrowKey(grid, cursor, intent.direction));
    } else {
      setCursor(wordToggle(grid, cursor));
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
    setCursor(cursor ? wordMoveTo(grid, cursor, coord) : wordStart(grid, coord));
  }

  return (
    <div data-testid="play-puzzle" data-session-state={displayedSessionState} className="px-2 py-6 min-[748px]:px-6">
      {/* Narrow below 1382px of room (a 1430px window, 17-S7): no title, controls
          or hint lists, and the hint bar under the grid (15-S5). Both
          arrangements are rendered and the container query picks one. */}
      <div className="@container/play">
        <h1 data-testid="play-title" className="mb-8 hidden text-title-1 text-primary @min-[1382px]/play:block">
          {view.title}
        </h1>
        <div
          className={`mx-auto flex max-w-(--play-grid-width) flex-col gap-3 @min-[1382px]/play:mb-0 @min-[1382px]/play:block @min-[1382px]/play:max-w-none ${narrowMessage ? 'mb-4' : ''}`}
          style={{ ['--play-grid-width' as string]: gridWidth }}
        >
          <div className={controlsRow ? 'contents @min-[1382px]/play:flex @min-[1382px]/play:h-8 @min-[1382px]/play:items-center @min-[1382px]/play:gap-3' : 'contents'}>
            {ready && unavailable && (
              <p data-testid="play-unavailable" role="alert" className="text-body-small text-error @min-[1382px]/play:ml-auto">
                This puzzle is no longer available.{' '}
                <Link href="/puzzles" className="text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover">Back to puzzles</Link>
              </p>
            )}
            {ready && !unavailable && (
              <div
                data-testid="play-save-status"
                data-save-state={saveState}
                role={saveState === 'error' ? 'alert' : 'status'}
                className={`text-body-small @min-[1382px]/play:ml-auto ${
                  saveState === 'error' ? 'text-error' : `hidden text-muted ${controlsRow ? '@min-[1382px]/play:block' : ''}`
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
            <p role="status" className="@min-[1382px]/play:mt-3 text-body-normal text-muted">Starting your puzzle…</p>
          )}
          {displayedSessionState === 'error' && (
            <div role="alert" className="@min-[1382px]/play:mt-3 space-y-3">
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
            <p data-testid="play-completion-error" role="alert" className="@min-[1382px]/play:mt-3 text-body-small text-error">
              Completion verification failed. Retry to check your saved entries before continuing.
            </p>
          )}
          {ready && localWarning && (
            <p data-testid="play-local-save-warning" className="@min-[1382px]/play:mt-3 text-body-small text-muted">
              Pending edits can’t be kept on this device. They may be lost if you leave before saving finishes.
            </p>
          )}
          {ready && locked && (
            <div className={`flex max-w-(--play-grid-width) items-baseline justify-between gap-3 ${controlsRow ? '@min-[1382px]/play:mt-3' : ''}`}>
              <p data-testid="play-lock-message" className="text-body-normal text-primary">
                The puzzle is complete.
              </p>
              {!unavailable && view.session && (
                <button
                  type="button"
                  data-testid="play-reset-link"
                  className={RESET_LINK}
                  // Some browsers do not focus a clicked button; Modal restores focus
                  // to whatever was focused when it opened.
                  onClick={(event) => {
                    event.currentTarget.focus();
                    setResetFailed(false);
                    setResetOpen(true);
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
        <div
          className={`mx-auto max-w-(--play-grid-width) ${locked ? '@min-[1382px]/play:mt-8' : '@min-[1382px]/play:mt-[27px]'} @min-[1382px]/play:grid @min-[1382px]/play:max-w-none @min-[1382px]/play:grid-cols-[var(--play-grid-width)_minmax(0,1fr)] @min-[1382px]/play:gap-x-[26px] @min-[1382px]/play:gap-y-4`}
          style={{ ['--play-grid-width' as string]: gridWidth }}
        >
          {/* A completed puzzle has no Prominent Hint or Rebus control, so the
              grid and the Player Hints take the first row (19-S1). */}
          {!locked && (
            <div className="hidden w-full max-w-(--play-grid-width) @min-[1382px]/play:block">
              <ProminentHint
                label={selectedSlot ? `${selectedSlot.number}${selectedSlot.orientation === 'across' ? 'A' : 'D'}` : null}
                hint={selectedKey ? view.hints[selectedKey] ?? '' : ''}
              />
            </div>
          )}
          <div
            ref={gridRegion}
            data-testid="play-grid-region"
            data-ready={ready}
            tabIndex={0}
            aria-label="Puzzle entries"
            aria-busy={checking || undefined}
            className={`w-full max-w-(--play-grid-width) outline-none @min-[1382px]/play:col-start-1 ${locked ? '@min-[1382px]/play:row-start-1' : '@min-[1382px]/play:row-start-2'}`}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <PuzzleGrid
              grid={grid}
              mode="play"
              highlights={highlights}
              onCellClick={handleCellClick}
              rebus={rebusValue === null || !cursor ? undefined : {
                coord: cursor.current, value: rebusValue, onChange: setRebusValue, onClose: closeRebusEntry,
              }}
            />
          </div>
          {/* Beside the grid, the lists scroll in their own box at the grid's
              height (15-S1): a zero height grown to the row's keeps them from
              stretching it. */}
          <div
            data-testid="play-clues"
            className={`hidden min-w-0 overflow-y-auto @min-[1382px]/play:col-start-2 ${locked ? '@min-[1382px]/play:row-start-1' : '@min-[1382px]/play:row-start-2'} @min-[1382px]/play:block @min-[1382px]/play:h-0 @min-[1382px]/play:min-h-full`}
          >
            <PlayerHints slots={slots} hints={view.hints} selectedKey={selectedKey} onSelect={handleHintClick} />
          </div>
          {!locked && (
            <div className="hidden @min-[1382px]/play:col-start-2 @min-[1382px]/play:row-start-1 @min-[1382px]/play:flex @min-[1382px]/play:items-center">
              <RebusControl variant="pill" isOpen={rebusValue !== null} disabled={!editable}
                onClick={() => (rebusValue === null ? openRebus() : closeRebusEntry(true))} />
            </div>
          )}
          <div className="@min-[1382px]/play:hidden">
            <PlayHintBar
              hint={selectedKey ? view.hints[selectedKey] ?? '' : ''}
              disabled={!editable}
              onStep={handleStep}
            />
            {!locked && (
              <div className="mt-3 flex justify-end">
                <RebusControl variant="pill" isOpen={rebusValue !== null} disabled={!editable}
                  onClick={() => (rebusValue === null ? openRebus() : closeRebusEntry(true))} />
              </div>
            )}
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
      <PlayResetDialog
        open={resetOpen}
        pending={resetPending}
        failed={resetFailed}
        onConfirm={() => void confirmReset()}
        onCancel={cancelReset}
        puzzleTitle={view.title}
      />
      {celebrating && <PlayConfetti onFinished={finishCelebration} />}
    </div>
  );
}
