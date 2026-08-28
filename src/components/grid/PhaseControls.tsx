import type { Phase } from '../../engine/puzzle';

export function PhaseControls({
  phase,
  onEnterHints,
}: {
  phase: Phase;
  onEnterHints: () => void;
}) {
  return (
    <div>
      <span data-testid="phase-badge">{phase}</span>
      {phase === 'grid' && (
        <button type="button" data-testid="enter-hints-button" onClick={onEnterHints}>
          Enter hints phase
        </button>
      )}
    </div>
  );
}
