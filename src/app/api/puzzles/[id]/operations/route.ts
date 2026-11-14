import { NextResponse } from 'next/server';
import { catchUpOperations, commitOperation } from '@/app/puzzles/actions';

// Epic 24 (24-S1): the commit path for keepalive sends, made while a page is
// being left, when a server action can't be relied on. It is only a wrapper
// around the `commitOperation` action: the same session gate (no session or
// no username is sent to `/`, as for every action) and the same commit.
// 24-S4: GET is the catch-up read an open editor polls, a wrapper around the
// `catchUpOperations` action. The version to catch up from is the
// `x-catch-up-since` header (none asks for the snapshot), so the URL stays
// the route's own.

/** The header naming the version a catch-up starts from. */
const SINCE_HEADER = 'x-catch-up-since';

/** Far above any valid operation (a full Sunday burst is ~30 KB). */
const MAX_BODY_LENGTH = 200_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await request.text();
  let input: unknown = null;
  if (text.length <= MAX_BODY_LENGTH) {
    try {
      input = JSON.parse(text);
    } catch {
      input = null;
    }
  }
  // The operation names its puzzle; it must be the one in the path.
  const valid = typeof input === 'object' && input !== null && (input as { puzzleId?: unknown }).puzzleId === id;
  const outcome = await commitOperation(valid ? input : null);
  const status = outcome.status === 'invalid' ? 400 : outcome.status === 'not-found' ? 404 : 200;
  return NextResponse.json(outcome, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const header = request.headers.get(SINCE_HEADER);
  const since = header === null ? null : /^[0-9]{1,15}$/.test(header) ? Number(header) : -1;
  const result = await catchUpOperations({ puzzleId: id, since });
  const status = result.status === 'invalid' ? 400 : result.status === 'not-found' ? 404 : 200;
  return NextResponse.json(result, { status, headers: { 'cache-control': 'no-store' } });
}
