'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Same pattern as NewPuzzleButton's data-ready: the submit handler isn't
    // live until hydration commits, and a click before then is dropped.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, []);

  async function handleSubmit() {
    setPending(true);
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/puzzles',
    });
    setPending(false);
    if (!error) setSent(true);
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
    <div data-testid="sign-in-form" data-ready={isReady}>
      <TextInput
        data-testid="sign-in-email"
        aria-label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
        disabled={pending}
      />
      <Button data-testid="sign-in-submit" onClick={handleSubmit} disabled={pending}>
        Send sign-in link
      </Button>
      <p data-testid="sign-in-privacy">
        We&apos;ll only use your address to send you a sign-in link — never shared, never spammed.
      </p>
    </div>
  );
}
