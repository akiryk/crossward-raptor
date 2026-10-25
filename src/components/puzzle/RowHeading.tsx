import { Title } from '@/components/ui/Title';

// Story 14-S2. A size group's heading: the label, then its dimensions.
export function RowHeading({ label, dimensions }: { label: string; dimensions: string | null }) {
  return (
    <div className="flex items-baseline gap-1 pl-[10px]">
      <Title size={3} as="h2" data-testid="puzzle-group-heading">{label}</Title>
      {dimensions !== null && (
        <span data-testid="puzzle-group-dimensions" className="text-label text-muted">{dimensions}</span>
      )}
    </div>
  );
}
