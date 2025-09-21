// /src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { clearSessionCookie, getSession, initializeFirebaseAdmin } from '@/lib/firebase/server-auth';

// Handler for POST requests to create a session
export async function POST(request: Request) {
  console.log('[v3] [/api/auth/session/route.ts] POST endpoint hit.');
  initializeFirebaseAdmin(); // Ensure admin app is initialized
  try {
    const body = await request.json();
    const idToken = body.idToken as string;

    if (!idToken) {
      console.error('[v3] [/api/auth/session/route.ts] ID token is required.');
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    
    console.log('[v3] [/api/auth/session/route.ts] Attempting to create session cookie.');
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    
    console.log('[v3] [/api/auth/session/route.ts] Session cookie created. Setting it in response headers.');
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
        maxAge: expiresIn / 1000, // maxAge is in seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
    
    console.log('[v3] [/api/auth/session/route.ts] Response prepared with session cookie.');
    return response;

  } catch (error: any) {
    console.error('[v3] [/api/auth/session/route.ts] Unhandled error in POST handler:', error.message, error);
    return NextResponse.json({ error: `Failed to create session: ${error.message}` }, { status: 500 });
  }
}

// Handler for DELETE requests to clear the session
export async function DELETE(request: Request) {
  console.log('[v3] [/api/auth/session/route.ts] DELETE endpoint hit.');
  try {
    const response = NextResponse.json({ success: true });
    console.log('[v3] [/api/auth/session/route.ts] Attempting to clear session cookie.');
    clearSessionCookie(response);
    console.log('[v3] [/api/auth/session/route.ts] Session cookie cleared successfully.');
    return response;
  } catch (error: any) {
    console.error('[v3] [/api/auth/session/route.ts] Error deleting session:', error.message, error);
    return NextResponse.json({ error: `Failed to delete session: ${error.message}` }, { status: 500 });
  }
}

// Handler for GET requests to check session status
export async function GET() {
    console.log('[v3] [/api/auth/session/route.ts] GET endpoint hit.');
    try {
        const session = await getSession();
        if (session) {
            return NextResponse.json({ user: session });
        }
        return NextResponse.json({ user: null }, { status: 401 });
    } catch (error: any) {
        console.error('[v3] [/api/auth/session/route.ts] GET error:', error.message, error);
        return NextResponse.json({ error: `Session check failed: ${error.message}` }, { status: 500 });
    }
}
