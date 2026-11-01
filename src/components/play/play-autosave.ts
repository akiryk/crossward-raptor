import type { PlayCompletionResult } from '@/app/puzzles/actions';
import { isFull } from '@/engine/play';
import { isCompatiblePlayEntries } from '@/lib/play-entries';
import { deserializeGrid, serializeGrid, type SerializedGrid } from '@/lib/puzzle-storage';

export type PlaySaveState = 'saved' | 'pending' | 'saving' | 'error';

export function playDraftKey(sessionId: string) {
  return `crossward:play-draft:v1:${sessionId}`;
}

/** One mounted tab owns one debounce and at most one entries write. */
export function createPlayAutosave({
  sessionId,
  serverEntries,
  save,
  onState,
  onLocalWarning,
  completion,
  initiallyComplete = false,
}: {
  sessionId: string;
  serverEntries: SerializedGrid;
  save: (entries: SerializedGrid) => Promise<void>;
  onState: (state: PlaySaveState) => void;
  onLocalWarning: () => void;
  initiallyComplete?: boolean;
  completion?: {
    inspect: () => Promise<PlayCompletionResult>;
    onPending: (pending: boolean) => void;
    onInspectionError: (failed: boolean) => void;
    onIncorrect: () => void;
    onComplete: (result: Extract<PlayCompletionResult, { status: 'complete' }>) => void;
  };
}) {
  const key = playDraftKey(sessionId);
  let latest = serverEntries;
  let latestValue = JSON.stringify(serverEntries);
  let savedValue = latestValue;
  let knownDraft: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let due = false;
  let failed: 'partial-save' | 'full-save' | 'inspection' | null = null;
  let reconcileFullFailure = false;
  let retryInspection = false;
  let pendingWrongFeedback = false;
  let paused = false;
  let completed = initiallyComplete;
  let active = true;

  function clearTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function removeIfMatching(value: string) {
    try {
      if (localStorage.getItem(key) === value) {
        localStorage.removeItem(key);
        if (knownDraft === value) knownDraft = null;
      }
    } catch {
      onLocalWarning();
    }
  }

  function keepLocally(value: string) {
    try {
      localStorage.setItem(key, value);
      knownDraft = value;
    } catch {
      onLocalWarning();
      // A failed replacement must not leave our older snapshot to overwrite a
      // newer server save on return. Preserve any value another tab replaced.
      if (knownDraft !== null) removeIfMatching(knownDraft);
    }
  }

  function setPaused(value: boolean) {
    paused = value;
    completion?.onPending(value);
  }

  function acceptCompletion(result: Extract<PlayCompletionResult, { status: 'complete' }>) {
    completed = true;
    latest = result.entries;
    latestValue = JSON.stringify(result.entries);
    savedValue = latestValue;
    clearTimer();
    due = false;
    // Canonical completion wins over this tab's stale edits. Never remove a
    // replacement another tab wrote after our last synchronous persistence.
    if (knownDraft !== null) removeIfMatching(knownDraft);
    completion?.onInspectionError(false);
    setPaused(false);
    onState('saved');
    completion?.onComplete(result);
  }

  async function flush() {
    if (!active || completed || inFlight || failed || !due) return;
    due = false;
    const snapshot = latest;
    const snapshotValue = latestValue;
    const full = !!completion && isFull(deserializeGrid(snapshot));
    const showIncorrect = pendingWrongFeedback;
    const reconciling = reconcileFullFailure;
    if (snapshotValue === savedValue && !(full && (showIncorrect || retryInspection)) && !reconciling) {
      removeIfMatching(latestValue);
      onState('saved');
      return;
    }
    inFlight = true;
    if (full || reconciling) setPaused(true);
    completion?.onInspectionError(false);
    onState('saving');
    let phase: 'save' | 'inspection' | 'reconciliation' = reconciling ? 'reconciliation' : 'save';
    try {
      // A rejected full save may actually have committed. Inspect before
      // attempting any replacement, even if the latest local edit is partial.
      if (reconciling && completion) {
        const result = await completion.inspect();
        if (!active) return;
        reconcileFullFailure = false;
        if (result.status === 'complete') {
          acceptCompletion(result);
          return;
        }
      }
      phase = 'save';
      if (reconciling || snapshotValue !== savedValue) {
        await save(snapshot);
        if (!active) return;
        savedValue = snapshotValue;
      }
      if (full && completion) {
        phase = 'inspection';
        const result = await completion.inspect();
        if (!active) return;
        retryInspection = false;
        // Responses only judge the snapshot that was submitted. The normal
        // full workflow pauses editing, but retain the guard for stale callers.
        if (snapshotValue === latestValue) {
          if (result.status === 'complete') {
            acceptCompletion(result);
            return;
          }
          pendingWrongFeedback = false;
          if (result.status === 'incorrect' && showIncorrect) completion.onIncorrect();
        }
      }
      if (!active) return;
      inFlight = false;
      setPaused(false);
      removeIfMatching(snapshotValue);
      if (latestValue === savedValue) {
        clearTimer();
        due = false;
        onState('saved');
      } else if (due) {
        void flush();
      } else {
        onState('pending');
      }
    } catch {
      if (!active) return;
      inFlight = false;
      failed = phase === 'inspection' ? 'inspection'
        : phase === 'reconciliation' || full ? 'full-save' : 'partial-save';
      // Acknowledged saves may already be solved and locked on the server;
      // verification Retry must preserve that snapshot and pause editing.
      const inspectionFailed = phase !== 'save';
      setPaused(inspectionFailed);
      completion?.onInspectionError(inspectionFailed);
      clearTimer();
      due = false;
      onState('error');
    }
  }

  function schedule() {
    clearTimer();
    due = false;
    if (failed) return;
    onState(inFlight ? 'saving' : 'pending');
    timer = setTimeout(() => {
      timer = null;
      due = true;
      void flush();
    }, 500);
  }

  // Call only after authenticated start has supplied this exact session ID.
  try {
    knownDraft = localStorage.getItem(key);
  } catch {
    onLocalWarning();
  }
  if (knownDraft !== null && initiallyComplete) {
    removeIfMatching(knownDraft);
  } else if (knownDraft !== null) {
    let cached: unknown;
    try { cached = JSON.parse(knownDraft); } catch { /* Ignore malformed drafts. */ }
    if (isCompatiblePlayEntries(cached, serverEntries)) {
      const recovered = serializeGrid(deserializeGrid(cached));
      const value = JSON.stringify(recovered);
      if (value === savedValue) {
        removeIfMatching(knownDraft);
      } else {
        latest = recovered;
        latestValue = value;
        keepLocally(value);
        schedule();
      }
    }
  }

  return {
    entries: latest,
    change(entries: SerializedGrid) {
      const value = JSON.stringify(entries);
      if (!active || completed || paused || value === latestValue) return false;
      if (completion) {
        const wasFull = isFull(deserializeGrid(latest));
        const full = isFull(deserializeGrid(entries));
        if (!full) pendingWrongFeedback = false;
        else if (!wasFull) pendingWrongFeedback = true;
      }
      latest = entries;
      latestValue = value;
      // Synchronous persistence precedes the debounce and server request.
      keepLocally(value);
      schedule();
      return true;
    },
    retry() {
      if (!active) return;
      clearTimer();
      reconcileFullFailure = failed === 'full-save';
      retryInspection = failed === 'inspection';
      failed = null;
      due = true;
      void flush();
    },
    stop() {
      active = false;
      clearTimer();
    },
  };
}
