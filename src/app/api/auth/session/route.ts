
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminApp } from '@/lib/firebase/session';

// Handler for POST requests to create a session
export async function POST(request: Request) {
  console.log('[testing log] [/api/auth/session] POST endpoint hit.');
  
  if (!adminApp) {
    const errorMsg = 'Server authentication not configured. Cannot create session.';
    console.error('[testing log] [/api/auth/session] Firebase Admin SDK is not initialized. Check server config.', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }

  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      console.log('[testing log] [/api/auth/session] No ID token provided in request body.');
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    console.log('[testing log] [/api/auth/session] Received ID token.');

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    console.log('[testing log] [/api/auth/session] Creating session cookie...');
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('[testing log] [/api/auth/session] Session cookie created successfully.');

    console.log('[testing log] [/api/auth/session] Setting cookie in browser response.');
    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    console.log('[testing log] [/api/auth/session] Session cookie set in browser.');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[testing log] [/api/auth/session] Error creating session cookie:', error.message, error);
    return NextResponse.json({ error: `Failed to create session: ${error.message}` }, { status: 500 });
  }
}

// Handler for DELETE requests to clear the session
export async function DELETE() {
  console.log('[testing log] [/api/auth/session] DELETE endpoint hit.');
  try {
    console.log('[testing log] [/api/auth/session] Deleting session cookie.');
    cookies().delete('__session');
    console.log('[testing log] [/api/auth/session] Session cookie deleted.');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[testing log] [/api/auth/session] Error deleting session cookie:', error.message, error);
    return NextResponse.json({ error: `Failed to delete session: ${error.message}` }, { status: 500 });
  }
}
