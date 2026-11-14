'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { addCollaborator, listCollaborators, removeCollaborator, revokeInvitation } from '@/app/puzzles/actions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';

type Collaborator = { userId: string; username: string | null };
type Invitation = { email: string };
type Listing =
  | { status: 'loading' }
  | { status: 'ok'; collaborators: readonly Collaborator[]; invitations: readonly Invitation[] }
  | { status: 'failed' };
type Outcome = { tone: 'status' | 'error'; text: string } | null;

const GONE = 'This puzzle is no longer available.';
const FAILED = 'Could not save the change. Please try again.';
const LOAD_FAILED = 'Could not load the collaborators. Please try again.';

// Remove and Revoke: text buttons in the label size, `error`, underlined on
// hover and keyboard focus (24-S6).
const ROW_ACTION = 'shrink-0 cursor-pointer text-label text-error outline-hidden hover:underline focus-visible:underline disabled:cursor-not-allowed disabled:opacity-50';

/** Story 24-S6: the owner's "Collaborators…" dialog, from an unpublished
 *  row's menu and from the editor. Adds by email (an account at once,
 *  otherwise a pending invitation), lists collaborators by username and
 *  invitations by address, removes and revokes. The list is always read
 *  from the server: on opening and after every change. Mounted fresh each
 *  time it opens. */
export function CollaboratorsDialog({ puzzleId, open, onClose }: {
  puzzleId: string;
  open: boolean;
  onClose: () => void;
}) {
  return open ? <CollaboratorsPanel puzzleId={puzzleId} onClose={onClose} /> : null;
}

/** Story 24-S6: the editor's "Collaborators…", at the end of the owner's
 *  step row, in Reset Grid's quiet look. */
export function CollaboratorsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="editor-collaborators"
      onClick={onClick}
      className="shrink-0 cursor-pointer text-label text-subtle outline-hidden transition-colors duration-150 ease-out hover:text-primary focus-visible:text-primary"
    >
      Collaborators…
    </button>
  );
}

function CollaboratorsPanel({ puzzleId, onClose }: { puzzleId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [listing, setListing] = useState<Listing>({ status: 'loading' });
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listCollaborators({ puzzleId });
      if (list.status === 'ok') {
        setListing({ status: 'ok', collaborators: list.collaborators, invitations: list.invitations });
      } else {
        setGone(true);
        setOutcome({ tone: 'error', text: GONE });
      }
    } catch {
      setListing({ status: 'failed' });
      setOutcome({ tone: 'error', text: LOAD_FAILED });
    }
  }, [puzzleId]);

  useEffect(() => {
    // The first read; later ones follow each change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const focusField = () => fieldRef.current?.querySelector('input')?.focus();

  /** Runs one change at a time; the list is read again afterwards. */
  async function change(work: () => Promise<Outcome | 'gone'>, after?: () => void) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await work();
      if (result === 'gone') {
        setGone(true);
        setOutcome({ tone: 'error', text: GONE });
        return;
      }
      setOutcome(result);
      await refresh();
      after?.();
    } catch {
      setOutcome({ tone: 'error', text: FAILED });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (email.trim() === '') return;
    void change(async () => {
      const result = await addCollaborator({ puzzleId, email });
      switch (result.status) {
        case 'added':
          setEmail('');
          return { tone: 'status', text: result.username ? `Added ${result.username}. They can edit this puzzle now.` : 'Added.' };
        case 'invited':
          setEmail('');
          return {
            tone: 'status',
            text: `Invited ${result.email}. The puzzle will be in their library once they sign in with that address.`,
          };
        case 'refused':
          return { tone: 'error', text: "That's your own address." };
        case 'invalid':
          return { tone: 'error', text: 'Enter a valid email address.' };
        default:
          return 'gone';
      }
    });
  }

  function remove(collaborator: Collaborator) {
    void change(async () => {
      const result = await removeCollaborator({ puzzleId, userId: collaborator.userId });
      if (result.status !== 'removed') return 'gone';
      return { tone: 'status', text: collaborator.username ? `Removed ${collaborator.username}.` : 'Removed.' };
    }, focusField);
  }

  function revoke(invitation: Invitation) {
    void change(async () => {
      const result = await revokeInvitation({ puzzleId, email: invitation.email });
      if (result.status !== 'revoked') return 'gone';
      return { tone: 'status', text: `Revoked the invitation to ${invitation.email}.` };
    }, focusField);
  }

  const disabled = gone || busy;
  const empty = listing.status === 'ok' && listing.collaborators.length === 0 && listing.invitations.length === 0;

  return (
    <Modal
      open
      title="Collaborators"
      testId="collaborators-dialog"
      onClose={onClose}
      footer={<Button data-testid="collaborators-done" onClick={onClose}>Done</Button>}
    >
      <p>Collaborators can edit the grid and hints with you. Only you can publish, reset, delete or manage collaborators.</p>
      <form onSubmit={add} className="flex items-end gap-3" noValidate>
        <div ref={fieldRef} data-modal-initial-focus className="min-w-0 flex-1">
          <TextInput
            data-testid="collaborators-email"
            aria-label="Email address"
            placeholder="name@example.com"
            value={email}
            onChange={setEmail}
            disabled={gone}
          />
        </div>
        <Button type="submit" data-testid="collaborators-add" disabled={disabled || email.trim() === ''}>
          Add
        </Button>
      </form>
      {outcome?.tone === 'status' && (
        <p data-testid="collaborators-message" role="status" className="text-muted">{outcome.text}</p>
      )}
      {outcome?.tone === 'error' && (
        <p data-testid="collaborators-error" role="alert" className="text-error">{outcome.text}</p>
      )}
      <div data-testid="collaborators-list" aria-label="Collaborators and invitations">
        {listing.status === 'loading' && <p className="text-muted">Loading…</p>}
        {empty && <p data-testid="collaborators-empty" className="text-muted">No collaborators yet.</p>}
        {listing.status === 'ok' && !empty && (
          <ul className="flex flex-col">
            {listing.collaborators.map((collaborator) => (
              <li
                key={collaborator.userId}
                data-testid="collaborator-row"
                data-user-id={collaborator.userId}
                className="flex min-h-9 items-center justify-between gap-4 border-b border-line-muted py-1.5"
              >
                <span className="min-w-0 truncate">{collaborator.username ?? '(no username)'}</span>
                <button
                  type="button"
                  data-testid="collaborator-remove"
                  onClick={() => remove(collaborator)}
                  disabled={disabled}
                  className={ROW_ACTION}
                >
                  Remove
                </button>
              </li>
            ))}
            {listing.invitations.map((invitation) => (
              <li
                key={invitation.email}
                data-testid="invitation-row"
                data-email={invitation.email}
                className="flex min-h-9 items-center justify-between gap-4 border-b border-line-muted py-1.5"
              >
                <span className="min-w-0 truncate">
                  {invitation.email}
                  <span className="ml-2 text-label text-muted">Pending</span>
                </span>
                <button
                  type="button"
                  data-testid="invitation-revoke"
                  onClick={() => revoke(invitation)}
                  disabled={disabled}
                  className={ROW_ACTION}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
