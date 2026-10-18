'use client';

import { useRef, useState, type FormEvent } from 'react';
import { saveDisplayName } from '@/app/puzzles/actions';
import { displayNameValidationMessage } from '@/lib/display-name';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TextInput } from '../ui/TextInput';

export function DisplayNameDialog({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (displayName: string) => void;
}) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const validationMessage = displayNameValidationMessage(name);

  function handleCancel() {
    if (!savingRef.current) onCancel();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || validationMessage) return;
    savingRef.current = true;
    setPending(true);
    setError('');
    try {
      const saved = await saveDisplayName({ displayName: name });
      onSaved(saved.displayName);
    } catch {
      setError('Could not save your builder name. Please try again.');
    } finally {
      savingRef.current = false;
      setPending(false);
    }
  }

  return (
    <Modal
      open
      title="Your builder name"
      testId="new-puzzle-dialog"
      onClose={handleCancel}
      dismissalDisabled={pending}
    >
      <form data-testid="display-name-step" onSubmit={handleSubmit}>
        <div data-modal-initial-focus className="flex flex-col gap-1">
          <span className="text-label text-ink-2">Builder name</span>
          <TextInput
            data-testid="display-name-input"
            aria-label="Builder name"
            value={name}
            onChange={(value) => { setName(value); setError(''); }}
            disabled={pending}
            autoFocus
          />
        </div>
        {validationMessage && <p className="mt-2 text-help">{validationMessage}</p>}
        {error && <p role="alert" className="mt-2 text-help">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="quiet"
            data-testid="display-name-cancel"
            onClick={handleCancel}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            data-testid="display-name-save"
            disabled={pending || validationMessage !== null}
          >
            Save and continue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
