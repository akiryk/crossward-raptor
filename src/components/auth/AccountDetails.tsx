'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { changeUsername } from '@/app/account-actions';
import { MastheadAction } from '@/components/layout/Masthead';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { TextInput } from '@/components/ui/TextInput';
import { usernameError } from '@/lib/username';

// Story 23-S4: the masthead's Account and its Account details modal. The
// modal opens with the values the page last rendered; a username change saves
// at once (changeUsername), closes the modal and refreshes the page's server
// data in place. The email is read-only until S5.

const SAVE_FAILED = 'Could not save your username. Please try again.';

export function AccountDetails({ username, email }: { username: string; email: string }) {
  const [open, setOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    // Focus returns to Account, also once the refresh after a save re-renders.
    requestAnimationFrame(() => accountRef.current?.querySelector('button')?.focus());
  }

  return (
    <>
      <div ref={accountRef} className="flex">
        <MastheadAction tone="account" data-testid="account" onClick={() => setOpen(true)}>
          Account
        </MastheadAction>
      </div>
      {open && <AccountDetailsModal username={username} email={email} onClose={close} />}
    </>
  );
}

function AccountDetailsModal({
  username,
  email,
  onClose,
}: {
  username: string;
  email: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(username);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const changed = value !== username;

  function focusField() {
    formRef.current?.querySelector<HTMLInputElement>('[data-testid="account-username"]')?.focus();
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!changed || saving) return;
    const problem = usernameError(value);
    if (problem) {
      setError(problem);
      focusField();
      return;
    }
    setSaving(true);
    try {
      const result = await changeUsername(value);
      if ('error' in result) {
        setError(result.error);
        setSaving(false);
        // The field is focused once it is enabled again.
        requestAnimationFrame(focusField);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError(SAVE_FAILED);
      setSaving(false);
      requestAnimationFrame(focusField);
    }
  }

  return (
    <Modal
      open
      title="Account details"
      headerVariant="gray"
      onClose={onClose}
      dismissalDisabled={saving}
      testId="account-details"
      footer={
        <ModalActions
          confirmLabel="Update"
          cancelLabel="Cancel"
          onConfirm={() => void submit()}
          onCancel={onClose}
          confirmDisabled={!changed || saving}
          cancelDisabled={saving}
          confirmTestId="account-update"
          cancelTestId="account-cancel"
        />
      }
    >
      {/* Update sits in the footer, outside the form, so Enter in the form
          submits through onKeyDown: the same as Update, nothing while it is
          disabled. */}
      <form
        ref={formRef}
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
          }
        }}
        className="w-[360px] max-w-full"
      >
        <div data-modal-initial-focus>
          <TextInput
            data-testid="account-username"
            caption="Username"
            value={value}
            onChange={(next) => {
              setValue(next);
              setError(undefined);
            }}
            error={error}
            disabled={saving}
          />
        </div>
        <div className="mt-5">
          <TextInput data-testid="account-email" caption="Email" value={email} onChange={() => {}} readOnly />
        </div>
      </form>
    </Modal>
  );
}
