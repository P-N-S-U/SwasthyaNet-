
import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {adminAuth} from '@/lib/firebase/session';

// Set session expiration to 5 days.
const expiresIn = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth) {
      throw new Error(
        'Firebase Admin SDK not initialized. Server-side authentication is unavailable.'
      );
    }
    const {idToken} = await request.json();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      path: '/',
    });
    return NextResponse.json({status: 'success'});
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({status: 'error'}, {status: 401});
  }
}

export async function DELETE() {
  try {
    cookies().delete('__session');
    return NextResponse.json({status: 'success'});
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({status: 'error'}, {status: 500});
  }
}
