import type { ReactNode } from 'react';

// Story F7. A heading in one of the four title styles and any text color
// style. The element follows `size` unless `as` overrides it; the style
// always follows `size`. No margins: callers lay it out.

export type TitleSize = 1 | 2 | 3 | 4;
export type TitleColor = 'primary' | 'muted' | 'link-muted' | 'highlight' | 'error' | 'subtle' | 'inverse';
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const SIZES: Record<TitleSize, string> = {
  1: 'text-title-1',
  2: 'text-title-2',
  3: 'text-title-3',
  4: 'text-title-4',
};

const COLORS: Record<TitleColor, string> = {
  primary: 'text-primary',
  muted: 'text-muted',
  'link-muted': 'text-link-muted',
  highlight: 'text-highlight',
  error: 'text-error',
  subtle: 'text-subtle',
  inverse: 'text-inverse',
};

export function Title({
  size,
  color = 'primary',
  as,
  id,
  'data-testid': testId,
  children,
}: {
  size: TitleSize;
  color?: TitleColor;
  as?: HeadingTag;
  id?: string;
  'data-testid'?: string;
  children: ReactNode;
}) {
  const Tag = as ?? (`h${size}` as HeadingTag);
  return (
    <Tag id={id} data-testid={testId} className={`${SIZES[size]} ${COLORS[color]}`}>
      {children}
    </Tag>
  );
}
