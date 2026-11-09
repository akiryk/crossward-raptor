'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { saveUsername } from '@/app/account-actions';
import { usernameError } from '@/lib/username';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

// Story 23-S3: the username step, shown at `/` to a signed-in account without
// a username. Pre-filled with a name generated on the server when the page
// renders (so the first paint holds it); saving goes on to /puzzles.
export function UsernameStep({ suggestion }: { suggestion: string }) {
  const [username, setUsername] = useState(suggestion);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // As the sign-in form: the submit handler isn't live until hydration
    // commits, and a click before then is dropped.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, []);

  function focusField() {
    formRef.current?.querySelector<HTMLInputElement>('[data-testid="username-input"]')?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const problem = usernameError(username);
    setMessage(problem);
    if (problem) {
      focusField();
      return;
    }

    submitting.current = true;
    setPending(true);
    setFailed(false);
    try {
      // On success the action redirects to /puzzles, so the step stays
      // disabled until the navigation replaces it.
      const result = await saveUsername(username);
      if (result?.error) {
        setMessage(result.error);
        submitting.current = false;
        setPending(false);
        // The field is focused once it is enabled again.
        requestAnimationFrame(focusField);
      }
    } catch {
      setFailed(true);
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      data-testid="username-step"
      data-ready={isReady}
      onSubmit={handleSubmit}
      noValidate
      className="mt-10 flex flex-1 flex-col"
    >
      <div className="w-[400px] max-w-full">
        <TextInput
          data-testid="username-input"
          size="large"
          caption="Username"
          placeholder="Your username..."
          value={username}
          onChange={(value) => {
            setUsername(value);
            setMessage(null);
          }}
          error={message ?? undefined}
          disabled={pending}
        />
      </div>
      <div className="mt-10 flex">
        <Button type="submit" size="large" data-testid="username-submit" disabled={pending}>
          Get Started
        </Button>
      </div>
      {failed && (
        <div role="alert" className="mt-5 text-body-large">
          <p className="text-primary">Could not save your username.</p>
          <p className="mt-4 text-muted">Please try again.</p>
        </div>
      )}
    </form>
  );
}
