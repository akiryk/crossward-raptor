export function BlackCell({
  onClick,
}: {
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return <div className="h-full w-full bg-foreground" onClick={onClick} />;
}
