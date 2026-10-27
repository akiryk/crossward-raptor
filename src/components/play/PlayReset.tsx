'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/** Every player's Puzzle options disclosure, plus the builder's visible shortcut. */
export function PlayResetControls({
  enabled,
  isBuilder,
  onReset,
}: {
  enabled: boolean;
  isBuilder: boolean;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const expanded = open && enabled;

  useEffect(() => {
    if (!expanded) return;
    function handlePointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [expanded]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !expanded) return;
    setOpen(false);
    optionsButton.current?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      {isBuilder && (
        <Button
          variant="alternate"
          data-testid="play-reset-button"
          disabled={!enabled}
          // Some browsers do not focus a clicked button; Modal restores focus
          // to whatever was focused when it opened.
          onClick={(event) => {
            event.currentTarget.focus();
            onReset();
          }}
        >
          Reset puzzle
        </Button>
      )}
      <div ref={container} className="relative" onKeyDown={handleKeyDown}>
        <Button
          ref={optionsButton}
          variant="alternate"
          data-testid="play-options"
          aria-expanded={expanded}
          aria-controls={expanded ? menuId : undefined}
          disabled={!enabled}
          onClick={(event) => {
            event.currentTarget.focus();
            setOpen((previous) => !previous);
          }}
        >
          Puzzle options
        </Button>
        {expanded && (
          <div
            id={menuId}
            className="absolute left-0 z-10 mt-1 min-w-full rounded-modal border border-line-muted bg-modal-background p-1"
          >
            <button
              type="button"
              data-testid="play-reset-option"
              className="w-full cursor-pointer whitespace-nowrap rounded-modal px-3 py-1 text-left text-body-normal text-primary transition-colors duration-150 ease-out hover:bg-puzzle-row-hover"
              onClick={() => {
                // Focus the disclosure button first so the dialog restores it.
                setOpen(false);
                optionsButton.current?.focus();
                onReset();
              }}
            >
              Reset puzzle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayResetDialog({
  open,
  pending,
  failed,
  onConfirm,
  onCancel,
  puzzleTitle,
}: {
  open: boolean;
  pending: boolean;
  failed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Names the puzzle where several could be reset, as in the library. */
  puzzleTitle?: string;
}) {
  return (
    <Modal
      open={open}
      title="Reset puzzle?"
      testId="play-reset-dialog"
      onClose={onCancel}
      dismissalDisabled={pending}
      footer={(
        <>
          <Button data-testid="play-reset-confirm" onClick={onConfirm} disabled={pending}>
            Reset puzzle
          </Button>
          <Button variant="alternate" data-testid="play-reset-cancel" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </>
      )}
    >
      {puzzleTitle === undefined ? (
        <p>
          This clears your entries and your completion record, and starts the puzzle over.
          It cannot be undone.
        </p>
      ) : (
        <p>
          This clears your entries and your completion record for{' '}
          <span className="font-semibold text-primary">{puzzleTitle}</span>,
          and starts the puzzle over. It cannot be undone.
        </p>
      )}
      {pending && <p data-testid="play-reset-pending" role="status">Resetting your puzzle…</p>}
      {failed && !pending && (
        <p data-testid="play-reset-error" role="alert" className="text-error">
          We couldn’t reset your puzzle. Please try again.
        </p>
      )}
    </Modal>
  );
}
