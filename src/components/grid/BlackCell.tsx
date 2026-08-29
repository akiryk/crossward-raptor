export function BlackCell({ onClick }: { onClick?: () => void }) {
  return <div className="h-full w-full bg-foreground" onClick={onClick} />;
}
