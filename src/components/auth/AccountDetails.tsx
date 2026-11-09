'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { changeEmail, changeUsername } from '@/app/account-actions';
import { MastheadAction } from '@/components/layout/Masthead';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { TextInput } from '@/components/ui/TextInput';
import { emailError, usernameError } from '@/lib/username';

// Story 23-S4: the masthead's Account and its Account details modal. The
// modal opens with the values the page last rendered; a username change saves
// at once (changeUsername), closes the modal and refreshes the page's server
// data in place.
//
// Story 23-S5: the email is editable. An email change is confirmed by the new
// address: Update asks the server (changeEmail) to mail it a link, and the
// modal then says where the link went, with Close. The account's email changes
// only when the link is followed. With both fields changed, the username saves
// first, then the email is requested.

const SAVE_FAILED = 'Could not save your username. Please try again.';
const SEND_FAILED = 'Could not send the confirmation link. Please try again.';

type Field = 'account-username' | 'account-email';

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
  const closeRef = useRef<HTMLDivElement>(null);
  // The username the modal compares against: the opened one, or the one this
  // Update has already saved (when the email then fails, only it is pending).
  const [savedUsername, setSavedUsername] = useState(username);
  const [usernameValue, setUsernameValue] = useState(username);
  const [emailValue, setEmailValue] = useState(email);
  const [usernameProblem, setUsernameProblem] = useState<string | undefined>();
  const [emailProblem, setEmailProblem] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const changed = usernameValue !== savedUsername || emailValue !== email;

  useEffect(() => {
    if (sentTo) closeRef.current?.querySelector('button')?.focus();
  }, [sentTo]);

  function focusField(field: Field) {
    formRef.current?.querySelector<HTMLInputElement>(`[data-testid="${field}"]`)?.focus();
  }

  /** Shows a server answer on a field; the field is focused once enabled again. */
  function fail(field: Field, message: string) {
    if (field === 'account-username') setUsernameProblem(message);
    else setEmailProblem(message);
    setSaving(false);
    requestAnimationFrame(() => focusField(field));
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!changed || saving) return;
    const usernameChanged = usernameValue !== savedUsername;
    const emailEdited = emailValue !== email;
    const usernameRule = usernameChanged ? usernameError(usernameValue) : null;
    const emailRule = emailEdited ? emailError(emailValue) : null;
    if (usernameRule || emailRule) {
      setUsernameProblem(usernameRule ?? undefined);
      setEmailProblem(emailRule ?? undefined);
      focusField(usernameRule ? 'account-username' : 'account-email');
      return;
    }
    // The address as it will be stored; the account's own, in any case or
    // spacing, is no email change.
    const newEmail = emailValue.trim().toLowerCase();
    const emailChanged = newEmail !== email.toLowerCase();
    if (!usernameChanged && !emailChanged) {
      onClose();
      return;
    }

    setSaving(true);
    if (usernameChanged) {
      try {
        const result = await changeUsername(usernameValue);
        if ('error' in result) return fail('account-username', result.error);
      } catch {
        return fail('account-username', SAVE_FAILED);
      }
      setSavedUsername(usernameValue);
      router.refresh();
      if (!emailChanged) {
        onClose();
        return;
      }
    }

    try {
      const result = await changeEmail(emailValue);
      if ('error' in result) return fail('account-email', result.error);
    } catch {
      return fail('account-email', SEND_FAILED);
    }
    setSaving(false);
    setSentTo(newEmail);
  }

  if (sentTo) {
    return (
      <Modal
        open
        title="Account details"
        headerVariant="gray"
        onClose={onClose}
        testId="account-details"
        footer={
          <div ref={closeRef} className="flex">
            <Button data-testid="account-close" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <p
          data-testid="account-email-sent"
          className="w-[360px] max-w-full text-body-normal text-primary [overflow-wrap:anywhere]"
        >
          Check {sentTo} for a link to confirm your new email.
        </p>
      </Modal>
    );
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
            value={usernameValue}
            onChange={(next) => {
              setUsernameValue(next);
              setUsernameProblem(undefined);
            }}
            error={usernameProblem}
            disabled={saving}
          />
        </div>
        <div className="mt-5">
          <TextInput
            data-testid="account-email"
            caption="Email"
            value={emailValue}
            onChange={(next) => {
              setEmailValue(next);
              setEmailProblem(undefined);
            }}
            error={emailProblem}
            disabled={saving}
          />
        </div>
      </form>
    </Modal>
  );
}
