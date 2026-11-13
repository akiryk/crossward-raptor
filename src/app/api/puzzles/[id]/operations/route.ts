import { NextResponse } from 'next/server';
import { commitOperation } from '@/app/puzzles/actions';

// Epic 24 (24-S1): the commit path for keepalive sends, made while a page is
// being left, when a server action can't be relied on. It is only a wrapper
// around the `commitOperation` action: the same session gate (no session or
// no username is sent to `/`, as for every action) and the same commit.
// S4 adds the catch-up read here.

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
