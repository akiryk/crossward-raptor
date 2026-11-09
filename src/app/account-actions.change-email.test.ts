import { beforeEach, describe, expect, it, vi } from 'vitest';

// Story 23-S5 — asking to change the email from Account details.
// `changeEmail(value)` is the Account details email request. Only a signed-in
// account that already has a username may call it (`requireSession()`;
// anything else is sent to /, nothing looked up or sent). The value must pass
// the email rules (lib/username `emailError`); it is trimmed and lowercased
// (Better Auth stores emails lowercased). The account's own email, in any case
// or spacing, is refused, and so is an email another account already uses:
// each with its message, nothing sent. Otherwise it asks lib/auth's
// `startEmailChange(<the request's headers>, <the new email>)` to send the
// confirmation link to the new address, and returns `{ ok: true }` without
// navigating. Better Auth refusing the address as invalid (its 400
// APIError; its rule is stricter than `emailError`, e.g. "a..b@x.co")
// returns the shape message; any other failure returns the send-failure
// message. It never writes the email (or anything else) itself: the email
// changes only when the link is followed. It takes no user id and ignores
// extra arguments.
//
// The in-use check may be `prisma.user.findUnique` or `findFirst`. Do not
// edit this file to match an implementation.

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  startEmailChange: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  write: vi.fn(),
  other: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession, changeEmail: mocks.other, updateUser: mocks.other } },
  startEmailChange: mocks.startEmailChange,
}));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/prisma', () => {
  const unsupported = new Proxy({}, { get: () => mocks.other });
  return {
    prisma: {
      user: {
        findUnique: mocks.userFindUnique,
        findFirst: mocks.userFindFirst,
        update: mocks.write,
        updateMany: mocks.write,
        upsert: mocks.write,
        create: mocks.write,
        delete: mocks.write,
        deleteMany: mocks.write,
      },
      puzzle: unsupported,
      playSession: unsupported,
      session: unsupported,
      account: unsupported,
      verification: unsupported,
      $transaction: mocks.other,
      $executeRaw: mocks.other,
      $queryRaw: mocks.other,
    },
  };
});

import * as accountActions from './account-actions';

const requestHeaders = new Headers({ cookie: 'better-auth.session_token=token' });
const BLANK = 'Oops! You need to add an email address.';
const SHAPE = "Oops! That doesn't look like an email address.";
const SAME = "Oops! That's already your email.";
const IN_USE = 'Oops! Another account already uses that email.';
const SEND_FAILED = 'Could not send the confirmation link. Please try again.';

/** The action under test, looked up so a missing export fails each case, not the file. */
function changeEmail(...args: unknown[]): Promise<unknown> {
  const action = (accountActions as Record<string, unknown>).changeEmail;
  if (typeof action !== 'function') throw new Error('account-actions exports no changeEmail');
  return (action as (...a: unknown[]) => Promise<unknown>)(...args);
}

function signedIn(displayName: unknown, email = 'own@example.test', id = 'own-user') {
  mocks.getSession.mockResolvedValue({
    user: { id, email, name: '', displayName },
    session: { id: `session-${id}`, userId: id },
  });
}

/** Another account already holds `email` (lowercased, as stored). */
function taken(email: string) {
  const match = (args: { where?: Record<string, unknown> } | undefined) =>
    JSON.stringify(args?.where ?? {}).toLowerCase().includes(email) ? { id: 'someone-else', email } : null;
  mocks.userFindUnique.mockImplementation(async (args) => match(args));
  mocks.userFindFirst.mockImplementation(async (args) => match(args));
}

function expectNothingSent() {
  expect(mocks.startEmailChange).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
  expect(mocks.other).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userFindFirst.mockResolvedValue(null);
  mocks.startEmailChange.mockResolvedValue(undefined);
});

describe('23-S5-U1 the module', () => {
  it('exports changeEmail, changeUsername and saveUsername and no other action', () => {
    const exported = Object.entries(accountActions)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(['changeEmail', 'changeUsername', 'saveUsername']);
  });
});

describe('23-S5-U2 asking to change the email', () => {
  it('sends the link to the new address through startEmailChange and returns { ok: true }, writing nothing', async () => {
    signedIn('Ada');
    await expect(changeEmail('new@example.test')).resolves.toEqual({ ok: true });
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    expect(mocks.startEmailChange).toHaveBeenCalledTimes(1);
    expect(mocks.startEmailChange).toHaveBeenCalledWith(requestHeaders, 'new@example.test');
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.other).not.toHaveBeenCalled();
  });

  it('trims and lowercases the new email', async () => {
    signedIn('Ada');
    await expect(changeEmail('  New.Person@Example.TEST \t')).resolves.toEqual({ ok: true });
    expect(mocks.startEmailChange).toHaveBeenCalledWith(requestHeaders, 'new.person@example.test');
  });

  it('acts only for the caller, whatever else is passed', async () => {
    signedIn('Caller', 'caller@example.test', 'caller');
    await expect(
      changeEmail('new@example.test', 'victim', { id: 'victim', userId: 'victim', email: 'victim@example.test' }),
    ).resolves.toEqual({ ok: true });
    expect(mocks.startEmailChange).toHaveBeenCalledTimes(1);
    expect(mocks.startEmailChange).toHaveBeenCalledWith(requestHeaders, 'new@example.test');
    expect(mocks.write).not.toHaveBeenCalled();
  });
});

describe('23-S5-U3 the email rules, on the server', () => {
  it.each([
    ['empty', '', BLANK],
    ['spaces', '   ', BLANK],
    ['tabs and newlines', '\t\n', BLANK],
    ['no @', 'ada.example.test', SHAPE],
    ['no dot in the domain', 'ada@example', SHAPE],
    ['two @', 'ada@@example.test', SHAPE],
    ['an inner space', 'ada lovelace@example.test', SHAPE],
  ])('refuses %s with its message and sends nothing', async (_label, value, message) => {
    signedIn('Ada');
    await expect(changeEmail(value)).resolves.toEqual({ error: message });
    expectNothingSent();
  });

  it.each([['undefined', undefined], ['null', null], ['a number', 42], ['an object', { toString: () => 'a@b.co' }], ['an array', ['a@b.co']]])(
    'refuses %s, which is not text, and sends nothing',
    async (_label, value) => {
      signedIn('Ada');
      await expect(changeEmail(value)).resolves.toEqual({ error: BLANK });
      expectNothingSent();
    },
  );
});

describe('23-S5-U4 the same email, or one already in use', () => {
  it.each([['exactly', 'own@example.test'], ['in another case', 'Own@Example.Test'], ['with spaces', '  own@example.test ']])(
    'the account’s own email (%s) is refused and nothing is sent',
    async (_label, value) => {
      signedIn('Ada', 'own@example.test');
      // The lookup finds the caller's own account: it is "the same", not "in use".
      const own = async (args: { where?: Record<string, unknown> } | undefined) =>
        JSON.stringify(args?.where ?? {}).toLowerCase().includes('own@example.test')
          ? { id: 'own-user', email: 'own@example.test' }
          : null;
      mocks.userFindUnique.mockImplementation(own);
      mocks.userFindFirst.mockImplementation(own);
      await expect(changeEmail(value)).resolves.toEqual({ error: SAME });
      expectNothingSent();
    },
  );

  it('an email another account uses is refused, in any case, and nothing is sent', async () => {
    signedIn('Ada');
    taken('taken@example.test');
    await expect(changeEmail('taken@example.test')).resolves.toEqual({ error: IN_USE });
    await expect(changeEmail('  Taken@Example.TEST ')).resolves.toEqual({ error: IN_USE });
    expectNothingSent();
  });

  it('an email no account uses is sent', async () => {
    signedIn('Ada');
    taken('taken@example.test');
    await expect(changeEmail('free@example.test')).resolves.toEqual({ ok: true });
    expect(mocks.startEmailChange).toHaveBeenCalledWith(requestHeaders, 'free@example.test');
  });
});

describe('23-S5-U5 a failure to send', () => {
  it('returns the send-failure message and writes nothing', async () => {
    signedIn('Ada');
    mocks.startEmailChange.mockRejectedValue(new Error('Could not deliver'));
    await expect(changeEmail('new@example.test')).resolves.toEqual({ error: SEND_FAILED });
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it('Better Auth refusing the address as invalid (a 400, stricter than the app’s rules) returns the shape message', async () => {
    signedIn('Ada');
    const { APIError } = await import('better-auth/api');
    mocks.startEmailChange.mockRejectedValue(new APIError('BAD_REQUEST', { message: 'Invalid email address' }));
    await expect(changeEmail('a..b@x.co')).resolves.toEqual({ error: SHAPE });
    expect(mocks.startEmailChange).toHaveBeenCalledWith(requestHeaders, 'a..b@x.co');
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it('any other Better Auth error is a failure to send', async () => {
    signedIn('Ada');
    const { APIError } = await import('better-auth/api');
    mocks.startEmailChange.mockRejectedValue(new APIError('INTERNAL_SERVER_ERROR', { message: 'boom' }));
    await expect(changeEmail('new@example.test')).resolves.toEqual({ error: SEND_FAILED });
  });
});

describe('23-S5-U6 only an account with a username', () => {
  it('without a session: sends the browser to / and looks up and sends nothing', async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(changeEmail('new@example.test')).rejects.toThrow(/^redirect:\/$/);
    expectNothingSent();
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it.each([['null', null], ['empty', ''], ['whitespace', ' \t '], ['missing', undefined]])(
    'a session whose username is %s is refused like no session and nothing is sent',
    async (_label, displayName) => {
      signedIn(displayName);
      await expect(changeEmail('new@example.test')).rejects.toThrow(/^redirect:\/$/);
      expectNothingSent();
      expect(mocks.userFindUnique).not.toHaveBeenCalled();
      expect(mocks.userFindFirst).not.toHaveBeenCalled();
    },
  );

  it('checks the session before the value', async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(changeEmail('')).rejects.toThrow(/^redirect:\/$/);
    signedIn(null);
    await expect(changeEmail('')).rejects.toThrow(/^redirect:\/$/);
    expectNothingSent();
  });
});
