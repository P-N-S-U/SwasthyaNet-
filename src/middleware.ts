
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/firebase/server-auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all routes under /admin
  if (pathname.startsWith('/admin')) {
    const session = await getSession();
    if (!session) {
      console.log('Middleware: No session found, redirecting to /auth');
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // The role-based check is now handled in the AdminLayout
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
