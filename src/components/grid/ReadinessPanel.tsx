import type { Finding } from '../../lib/publish-readiness';

export function ReadinessPanel({ findings }: { findings: readonly Finding[] }) {
  return (
    <div data-testid="readiness-panel" className="flex flex-col gap-1">
      {findings.length === 0 ? (
        <p data-testid="readiness-clear">Nothing outstanding.</p>
      ) : (
        findings.map((finding) => (
          <p key={finding.kind} data-testid="finding" data-finding-kind={finding.kind}>
            {finding.message}
          </p>
        ))
      )}
    </div>
  );
}
