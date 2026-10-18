import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

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
