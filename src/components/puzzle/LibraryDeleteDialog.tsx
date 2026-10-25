'use client';

import { useRef, useState } from 'react';
import { deletePuzzle } from '@/app/puzzles/actions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ROW_CONTROL } from './library-row';

/** Build's Delete control and its confirmation. */
export function LibraryDelete({ puzzleId, title, onDeleted }: {
  puzzleId: string;
  title: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  function cancel() {
    if (busy.current) return;
    setOpen(false);
    setFailed(false);
  }

  async function confirm() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    try {
      await deletePuzzle(puzzleId);
    } catch {
      setFailed(true);
      return;
    } finally {
      busy.current = false;
      setPending(false);
    }
    setOpen(false);
    onDeleted();
  }

  return (
    <>
      <button
        type="button"
        data-testid="puzzle-delete-button"
        className={ROW_CONTROL}
        onClick={(event) => {
          event.currentTarget.focus();
          setFailed(false);
          setOpen(true);
        }}
      >
        Delete
      </button>
      <Modal
        open={open}
        title="Delete puzzle?"
        testId="puzzle-delete-dialog"
        onClose={cancel}
        dismissalDisabled={pending}
        footer={(
          <>
            <Button data-testid="puzzle-delete-confirm" onClick={() => void confirm()} disabled={pending}>
              Delete puzzle
            </Button>
            <Button variant="alternate" data-testid="puzzle-delete-cancel" onClick={cancel} disabled={pending}>
              Cancel
            </Button>
          </>
        )}
      >
        <p>This deletes {title}. This cannot be undone.</p>
        {failed && !pending && (
          <p data-testid="puzzle-delete-error" role="alert" className="text-error">
            Could not delete the puzzle. Please try again.
          </p>
        )}
      </Modal>
    </>
  );
}
