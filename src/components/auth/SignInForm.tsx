'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Same pattern as NewPuzzleButton's data-ready: the submit handler isn't
    // live until hydration commits, and a click before then is dropped.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: '/puzzles',
      });
      if (error) {
        setError('Could not send the sign-in link. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Could not send the sign-in link. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div data-testid="sign-in-form" data-ready={isReady}>
        <p data-testid="sign-in-sent">Check your email for a sign-in link.</p>
        <p data-testid="sign-in-privacy">
          We&apos;ll only use your address to send you a sign-in link — never shared, never spammed.
        </p>
      </div>
    );
  }

  return (
    <form data-testid="sign-in-form" data-ready={isReady} onSubmit={handleSubmit}>
      <TextInput
        data-testid="sign-in-email"
        aria-label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
        disabled={pending}
      />
      <Button type="submit" data-testid="sign-in-submit" disabled={pending}>
        Send sign-in link
      </Button>
      {error && <p role="alert">{error}</p>}
      <p data-testid="sign-in-privacy">
        We&apos;ll only use your address to send you a sign-in link — never shared, never spammed.
      </p>
    </form>
  );
}
