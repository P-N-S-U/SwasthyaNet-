
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/firebase/server-auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all routes under /obviouslynotadmins
  if (pathname.startsWith('/obviouslynotadmins')) {
    const session = await getSession();
    if (!session) {
      const loginUrl = new URL('/admin-auth', request.url);
      // Pass the original URL as a 'next' query parameter for redirection after login
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // The role-based authorization check is handled in the AdminLayout server component
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes under /obviouslynotadmins, including the root /obviouslynotadmins page
  matcher: ['/obviouslynotadmins/:path*'],
};
