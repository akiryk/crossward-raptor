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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
