import Link from 'next/link';
import { listPuzzles } from './actions';
import { NewPuzzleButton } from './NewPuzzleButton';
import { puzzleStatus, type StatusKind } from '@/lib/puzzle-status';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BADGE_CLASS: Record<StatusKind, string> = {
  grid: 'border border-rule-strong text-ink-2',
  hints: 'border border-rule-strong text-ink-2',
  published: 'border border-transparent bg-ok-tint text-accent',
};

export default async function PuzzlesPage() {
  const puzzles = await listPuzzles();

  return (
    <div className="p-6">
      <div data-testid="puzzle-list-header" className="flex items-center justify-between">
        <h1
          data-testid="page-heading"
          className="font-display text-headline [font-weight:var(--weight-bold)]"
        >
          Puzzles
        </h1>
        <NewPuzzleButton />
      </div>
      <ul data-testid="puzzle-list" className="mt-6">
        {puzzles.map((puzzle) => {
          const isPublished = puzzle.publishedAt !== null;
          const status = puzzleStatus(puzzle);
          return (
            <li
              key={puzzle.id}
              data-testid="puzzle-list-item"
              data-phase={puzzle.phase}
              data-hints-complete={puzzle.hintsComplete ? 'true' : 'false'}
              data-updated-at={puzzle.updatedAt.toISOString()}
              data-published={isPublished ? 'true' : 'false'}
              data-visibility={puzzle.visibility}
              data-published-at={isPublished ? puzzle.publishedAt!.toISOString() : undefined}
              className="flex items-center justify-between gap-3 border-b border-rule py-3 text-body"
            >
              <div className="min-w-0">
                <p
                  data-testid="puzzle-list-title"
                  className="truncate font-display text-foreground [font-weight:var(--weight-bold)]"
                >
                  {puzzle.title}
                </p>
                <p className="text-help text-ink-2 flex items-center gap-2">
                  <span
                    data-testid="puzzle-status-badge"
                    data-status-kind={status.kind}
                    className={`rounded-btn px-2 py-0.5 text-label ${BADGE_CLASS[status.kind]}`}
                  >
                    {status.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span data-testid="puzzle-list-updated">
                    Updated {formatDate(puzzle.updatedAt)}
                  </span>
                </p>
              </div>
              <Link
                href={`/puzzles/${puzzle.id}`}
                data-testid="puzzle-edit-link"
                className="shrink-0 cursor-pointer rounded-btn border border-rule-strong bg-background px-3 py-1 text-body text-accent hover:bg-hover-tint"
              >
                Edit
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
