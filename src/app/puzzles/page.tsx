import Link from 'next/link';
import { listPuzzles } from './actions';
import { NewPuzzleButton } from './NewPuzzleButton';
import { puzzleStatus, type StatusKind } from '@/lib/puzzle-status';
import { groupPuzzles } from '@/lib/puzzle-groups';
import { GridThumbnail } from '@/components/puzzle/GridThumbnail';

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
  const groups = groupPuzzles(puzzles);

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div data-testid="puzzle-list-header" className="flex items-center justify-between">
          <h1
            data-testid="page-heading"
            className="font-display text-headline [font-weight:var(--weight-bold)]"
          >
            Puzzles
          </h1>
          <NewPuzzleButton />
        </div>
        <div data-testid="puzzle-list" className="mt-6 flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.size ?? 'other'} data-testid="puzzle-group" data-size={group.size ?? 'other'}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2
                  data-testid="puzzle-group-heading"
                  className="font-display text-foreground [font-weight:var(--weight-bold)]"
                >
                  {group.label}
                </h2>
                {group.dimensions !== null && (
                  <span data-testid="puzzle-group-dimensions" className="text-label text-ink-3">
                    {group.dimensions}
                  </span>
                )}
              </div>
              <ul>
                {group.puzzles.map((puzzle) => {
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
                      className="flex items-center gap-3 border-b border-rule py-3 text-body"
                    >
                      <GridThumbnail cols={puzzle.cols} rows={puzzle.rows} black={puzzle.black} />
                      <div className="min-w-0 flex-1">
                        <p
                          data-testid="puzzle-list-title"
                          className="truncate text-body font-display text-foreground [font-weight:var(--weight-bold)]"
                        >
                          {puzzle.title}
                        </p>
                        <p
                          data-testid="puzzle-list-updated"
                          className="text-help text-ink-2"
                        >
                          Updated {formatDate(puzzle.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          data-testid="puzzle-status-badge"
                          data-status-kind={status.kind}
                          className={`rounded-btn px-2 py-0.5 text-label ${BADGE_CLASS[status.kind]}`}
                        >
                          {status.label}
                        </span>
                        <Link
                          href={`/puzzles/${puzzle.id}`}
                          data-testid="puzzle-edit-link"
                          className="cursor-pointer rounded-btn border border-rule-strong bg-background px-3 py-1 text-body text-accent hover:bg-hover-tint"
                        >
                          Edit
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
