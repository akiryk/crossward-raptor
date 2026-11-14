import { NextResponse } from 'next/server';
import { updatePresence } from '@/app/puzzles/actions';

// Epic 24 (24-S7): a tab going away (hidden) or leaving (closed), sent with
// keepalive as the page is hidden or left, when a server action can't be
// relied on. A wrapper around the `updatePresence` action: the same session
// gate as every action. The body is `{ clientId, state }`; the puzzle is the
// path's.

/** Far above a valid body. */
const MAX_BODY_LENGTH = 1_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await request.text();
  let body: unknown = null;
  if (text.length <= MAX_BODY_LENGTH) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  const input = typeof body === 'object' && body !== null && !Array.isArray(body) ? { ...body, puzzleId: id } : null;
  const outcome = await updatePresence(input);
  const status = outcome.status === 'invalid' ? 400 : outcome.status === 'not-found' ? 404 : 200;
  return NextResponse.json(outcome, { status });
}
