'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { emailError, usernameError } from '@/lib/username';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

const USERNAME_KEY = 'crossward:username';

function HelpLine() {
  return (
    <p data-testid="sign-in-privacy" className="mt-auto pt-10 text-body-small text-muted">
      We’ll only use your email to send a sign-in link. It will not be shared or used for any other purpose.
    </p>
  );
}

export function SignInForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Same pattern as NewPuzzleButton's data-ready: the submit handler isn't
    // live until hydration commits, and a click before then is dropped. The
    // last username sent from this browser pre-fills the form in that commit.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(USERNAME_KEY);
    } catch {
      // Storage can be unavailable; the field just starts empty.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setUsername(stored);
    setIsReady(true);
  }, []);

  function focusField(testId: string) {
    formRef.current?.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nameProblem = usernameError(username);
    const emailProblem = emailError(email);
    setUsernameMessage(nameProblem);
    setEmailMessage(emailProblem);
    if (nameProblem || emailProblem) {
      focusField(nameProblem ? 'sign-in-username' : 'sign-in-email');
      return;
    }

    const name = username.trim();
    submitting.current = true;
    setPending(true);
    setFailed(false);
    try {
      const { error } = await authClient.signIn.magicLink({
        email: email.trim(),
        name,
        callbackURL: '/puzzles',
      });
      if (error) {
        setFailed(true);
      } else {
        try {
          localStorage.setItem(USERNAME_KEY, name);
        } catch {
          // Not remembering the username is harmless.
        }
        setSent(true);
      }
    } catch {
      setFailed(true);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div data-testid="sign-in-form" data-ready={isReady} className="mt-10 flex flex-1 flex-col">
        <p data-testid="sign-in-sent" className="text-body-large text-primary">
          Check your email for the magic link that signs you in.
        </p>
        <p className="text-body-large text-muted">Pro-tip: check your spam folder, it&apos;s probably in there.</p>
        <HelpLine />
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      data-testid="sign-in-form"
      data-ready={isReady}
      onSubmit={handleSubmit}
      noValidate
      className="mt-10 flex flex-1 flex-col"
    >
      <div className="w-[400px] max-w-full">
        <TextInput
          data-testid="sign-in-username"
          size="large"
          aria-label="Username"
          placeholder="Your username..."
          value={username}
          onChange={(value) => {
            setUsername(value);
            setUsernameMessage(null);
          }}
          error={usernameMessage ?? undefined}
          disabled={pending}
        />
      </div>
      <div className="mt-5 w-[400px] max-w-full">
        <TextInput
          data-testid="sign-in-email"
          size="large"
          aria-label="Email"
          placeholder="Your email address..."
          value={email}
          onChange={(value) => {
            setEmail(value);
            setEmailMessage(null);
          }}
          error={emailMessage ?? undefined}
          disabled={pending}
        />
      </div>
      <div className="mt-10 flex">
        <Button type="submit" size="large" data-testid="sign-in-submit" disabled={pending}>
          Send Sign-in Link
        </Button>
      </div>
      {failed && (
        <div role="alert" className="mt-5 text-body-large">
          <p className="text-primary">Could not send the sign-in link.</p>
          <p className="text-muted">Please try again.</p>
        </div>
      )}
      <HelpLine />
    </form>
  );
}
