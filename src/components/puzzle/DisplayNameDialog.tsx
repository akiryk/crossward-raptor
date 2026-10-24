'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
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
  const formId = useId();
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
      footer={
        <>
          <Button
            type="submit"
            form={formId}
            data-testid="display-name-save"
            disabled={pending || validationMessage !== null}
          >
            Save and continue
          </Button>
          <Button
            variant="alternate"
            data-testid="display-name-cancel"
            onClick={handleCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        </>
      }
    >
      <form id={formId} data-testid="display-name-step" onSubmit={handleSubmit}>
        <div data-modal-initial-focus>
          <TextInput
            data-testid="display-name-input"
            label="Builder name"
            aria-label="Builder name"
            value={name}
            onChange={(value) => { setName(value); setError(''); }}
            disabled={pending}
            autoFocus
          />
        </div>
        {validationMessage && <p className="mt-2 text-help">{validationMessage}</p>}
        {error && <p role="alert" className="mt-2 text-help">{error}</p>}
      </form>
    </Modal>
  );
}
