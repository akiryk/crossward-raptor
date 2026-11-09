import type { ReactNode } from 'react';
import { requireSession } from '@/lib/require-session';

// Story 23-S3: every page under /puzzles needs an account with a username.
// Each page's data still comes through guarded actions (a layout and its page
// render concurrently), so this is the second guard, not the only one.
export default async function PuzzlesLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return children;
}
