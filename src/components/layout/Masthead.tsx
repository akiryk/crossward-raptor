import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

// Story F7. The app header: a full-width white bar with a 1px hairline
// along its bottom. The logo, a link home, has 20px to the top, the left
// and the hairline; `action` (Sign out, when signed in) sits 20px from the
// right, centred on the logo. 23-S4: signed in with a username, the action is
// "Account | Sign out".

export function Masthead({
  action,
  homeLinkTestId,
  'data-testid': testId,
}: {
  action?: ReactNode;
  homeLinkTestId?: string;
  'data-testid'?: string;
}) {
  return (
    <header
      data-testid={testId}
      className="flex w-full items-center justify-between border-b border-line-muted bg-masthead p-5"
    >
      <Link href="/" data-testid={homeLinkTestId} className="group/logo flex outline-none">
        <Logo interactive />
      </Link>
      {action}
    </header>
  );
}

/** The masthead's link-looking action. Hover and keyboard focus show `button-hover`.
 *  `tone` is its rest color: `link-muted` (Sign out) or `masthead-account` (23-S4). */
export function MastheadAction({
  tone = 'link',
  onClick,
  'data-testid': testId,
  children,
}: {
  tone?: 'link' | 'account';
  onClick?: () => void;
  'data-testid'?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`-my-1 cursor-pointer text-button-normal ${tone === 'account' ? 'text-masthead-account' : 'text-link-muted'} outline-none transition-colors duration-150 ease-out hover:text-button-hover focus-visible:text-button-hover`}
    >
      {children}
    </button>
  );
}

/** The 1px × 18px `line-muted` line between masthead actions, 10px from each (23-S4). */
export function MastheadDivider() {
  return <span aria-hidden="true" data-testid="masthead-divider" className="mx-2.5 h-[18px] w-px shrink-0 bg-line-muted" />;
}
