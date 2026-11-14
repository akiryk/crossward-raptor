import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { RELOAD_COOKIE, staleEditorReload } from '@/lib/stale-editor';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/' || pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Optimistic cookie-presence check only — no DB call here. Full
  // validation runs in the puzzle actions and style-guide server layout.
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 24-S3: a server action from an editor tab of an earlier deployment
  // reloads that tab into this one (src/lib/stale-editor.ts). Production
  // builds only: `next dev` doesn't send the deployment ID.
  const reload = process.env.NODE_ENV === 'production'
    ? staleEditorReload({
        method: request.method,
        pathname,
        search: request.nextUrl.search,
        headers: request.headers,
        hasReloadCookie: request.cookies.has(RELOAD_COOKIE),
      }, process.env.NEXT_DEPLOYMENT_ID)
    : null;
  if (reload) return new NextResponse(null, { status: 200, headers: reload });

  // Next 16 skips the page subtree for router prefetches even on HTML
  // requests, leaving its HTML stream waiting on the omitted children.
  // Render these HTML reads normally; real RSC prefetches keep their hint.
  if (
    request.method === 'GET' &&
    /^\/puzzles\/[^/]+\/play\/?$/.test(pathname) &&
    request.headers.get('next-router-prefetch') === '1' &&
    !request.headers.has('rsc')
  ) {
    const headers = new Headers(request.headers);
    headers.delete('next-router-prefetch');
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
