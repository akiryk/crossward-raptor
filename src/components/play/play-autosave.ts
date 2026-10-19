import { isCompatiblePlayEntries } from '@/lib/play-entries';
import { deserializeGrid, serializeGrid, type SerializedGrid } from '@/lib/puzzle-storage';

export type PlaySaveState = 'saved' | 'pending' | 'saving' | 'error';

/** One mounted tab owns one debounce and at most one entries write. */
export function createPlayAutosave({
  sessionId,
  serverEntries,
  save,
  onState,
  onLocalWarning,
}: {
  sessionId: string;
  serverEntries: SerializedGrid;
  save: (entries: SerializedGrid) => Promise<void>;
  onState: (state: PlaySaveState) => void;
  onLocalWarning: () => void;
}) {
  const key = `crossward:play-draft:v1:${sessionId}`;
  let latest = serverEntries;
  let latestValue = JSON.stringify(serverEntries);
  let savedValue = latestValue;
  let knownDraft: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let due = false;
  let failed = false;
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

  function flush() {
    if (!active || inFlight || failed || !due) return;
    due = false;
    if (latestValue === savedValue) {
      removeIfMatching(latestValue);
      onState('saved');
      return;
    }
    const snapshot = latest;
    const snapshotValue = latestValue;
    inFlight = true;
    onState('saving');
    save(snapshot).then(() => {
      if (!active) return;
      inFlight = false;
      savedValue = snapshotValue;
      removeIfMatching(snapshotValue);
      if (latestValue === savedValue) {
        clearTimer();
        due = false;
        onState('saved');
      } else if (due) {
        flush();
      } else {
        onState('pending');
      }
    }, () => {
      if (!active) return;
      inFlight = false;
      failed = true;
      clearTimer();
      due = false;
      onState('error');
    });
  }

  function schedule() {
    clearTimer();
    due = false;
    if (failed) return;
    onState(inFlight ? 'saving' : 'pending');
    timer = setTimeout(() => {
      timer = null;
      due = true;
      flush();
    }, 500);
  }

  // Call only after authenticated start has supplied this exact session ID.
  try {
    knownDraft = localStorage.getItem(key);
  } catch {
    onLocalWarning();
  }
  if (knownDraft !== null) {
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
      if (!active || value === latestValue) return;
      latest = entries;
      latestValue = value;
      // Synchronous persistence precedes the debounce and server request.
      keepLocally(value);
      schedule();
    },
    retry() {
      if (!active) return;
      clearTimer();
      failed = false;
      due = true;
      flush();
    },
    stop() {
      active = false;
      clearTimer();
    },
  };
}
