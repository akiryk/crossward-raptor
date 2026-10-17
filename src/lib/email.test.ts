import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A6 frozen acceptance specification. Mock transport boundaries, never the
// application's delivery selection; no inbox, database, or email network I/O.
const transport = vi.hoisted(() => ({
  constructed: vi.fn(),
  send: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    constructor(key: string) { transport.constructed(key); }
    emails = { send: transport.send };
  },
}));

const EMAIL = 'a6-local@example.test';
const LINK = 'http://localhost:3000/api/auth/magic-link/verify?token=a6-fixture&callbackURL=%2Fpuzzles';

async function deliver() {
  const { sendMagicLink } = await import('./email');
  return sendMagicLink(EMAIL, LINK);
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubGlobal('fetch', transport.fetch);
  transport.fetch.mockResolvedValue(new Response(JSON.stringify({ ID: 'a6-captured' }), {
    status: 200, headers: { 'content-type': 'application/json' },
  }));
  transport.send.mockResolvedValue({ data: { id: 'a6-delivered' }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function expectLocalMessage() {
  expect(transport.fetch).toHaveBeenCalledTimes(1);
  const [resource, init] = transport.fetch.mock.calls[0] as [string | URL, RequestInit];
  expect(String(resource)).toBe('http://127.0.0.1:8025/api/v1/send');
  expect(init.method?.toUpperCase()).toBe('POST');
  expect(new Headers(init.headers).get('content-type')).toContain('application/json');
  expect(typeof init.body).toBe('string');
  const message = JSON.parse(init.body as string);
  expect(message.From).toEqual(expect.objectContaining({ Email: 'login@crossward.app' }));
  expect(message.To).toEqual([expect.objectContaining({ Email: EMAIL })]);
  expect(message.Subject).toEqual(expect.stringMatching(/sign.in/i));
  expect(message.Text).toContain(LINK);
  expect(transport.constructed).not.toHaveBeenCalled();
  expect(transport.send).not.toHaveBeenCalled();
}

describe('A6 — local development delivery and production/test isolation', () => {
  it('captures the real supplied link in the local inbox without a Resend key', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await deliver();
    expectLocalMessage();
  });

  it('uses the local inbox even if local development inherited a Resend key', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    await deliver();
    expectLocalMessage();
  });

  it('reports local inbox HTTP failure without falling back to real email', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    transport.fetch.mockResolvedValue(new Response(JSON.stringify({ Error: 'Inbox unavailable' }), {
      status: 503, headers: { 'content-type': 'application/json' },
    }));
    await expect(deliver()).rejects.toThrow();
    expect(transport.fetch).toHaveBeenCalledTimes(1);
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('reports an unreachable local inbox without silently succeeding', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    transport.fetch.mockRejectedValue(new TypeError('Connection refused'));
    await expect(deliver()).rejects.toThrow();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('keeps production Resend delivery and the supplied sign-in link', async () => {
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    await deliver();
    expect(transport.constructed).toHaveBeenCalledWith('a6-fake-key');
    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(transport.send).toHaveBeenCalledWith(expect.objectContaining({
      to: EMAIL,
      text: expect.stringContaining(LINK),
    }));
    expect(transport.fetch).not.toHaveBeenCalled();
  });

  it('preserves the keyless production no-op used by the production E2E harness', async () => {
    await deliver();
    expect(transport.fetch).not.toHaveBeenCalled();
    expect(transport.constructed).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('never enables a local inbox on Vercel even with development NODE_ENV', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    await deliver();
    expect(transport.fetch).not.toHaveBeenCalled();
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('does not contact either delivery service in unit-test mode even with a key', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    await deliver();
    expect(transport.fetch).not.toHaveBeenCalled();
    expect(transport.constructed).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('continues to propagate a real provider rejection in production', async () => {
    vi.stubEnv('RESEND_API_KEY', 'a6-fake-key');
    transport.send.mockResolvedValue({ data: null, error: { name: 'ProviderRejected' } });
    await expect(deliver()).rejects.toThrow();
    expect(transport.fetch).not.toHaveBeenCalled();
  });
});
