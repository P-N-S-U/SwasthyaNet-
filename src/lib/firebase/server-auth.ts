
// /src/lib/firebase/server-auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

const isFirebaseAdminConfigured =
  serviceAccount.projectId &&
  serviceAccount.clientEmail &&
  serviceAccount.privateKey;

if (isFirebaseAdminConfigured && !getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('[v3] [server-auth] Firebase Admin SDK initialized successfully.');
  } catch (e: any) {
    console.error('[v3] [server-auth] Firebase Admin SDK initialization failed:', e.message);
  }
}

const COOKIE_NAME = '__session';

export function clearSessionCookie(response: NextResponse) {
  console.log('[v3] [server-auth] Clearing session cookie.');
  response.cookies.delete(COOKIE_NAME);
}

export async function getSession(): Promise<DecodedIdToken | null> {
  if (!isFirebaseAdminConfigured) {
    console.error('[v3] [server-auth] Cannot get session: Firebase Admin is not configured.');
    return null;
  }

  const cookieValue = cookies().get(COOKIE_NAME)?.value;
  if (!cookieValue) {
    console.log('[v3] [server-auth] Session cookie not found.');
    return null;
  }

  try {
    console.log('[v3] [server-auth] Verifying session cookie...');
    const decodedIdToken = await getAuth().verifySessionCookie(cookieValue, true);
    console.log(`[v3] [server-auth] Session cookie verified for UID: ${decodedIdToken.uid}`);
    return decodedIdToken;
  } catch (error: any) {
    console.error('[v3] [server-auth] Error verifying session cookie:', error.code, error.message);
    return null;
  }
}
