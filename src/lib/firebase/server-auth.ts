
// /src/lib/firebase/server-auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';

export function initializeFirebaseAdmin(): App {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  };

  const isConfigured =
    serviceAccount.projectId &&
    serviceAccount.clientEmail &&
    serviceAccount.privateKey;

  if (!isConfigured) {
    console.error('[v3] [server-auth] Firebase Admin is NOT configured. Service account details are missing or incomplete in .env file.');
    console.log(`[v3] [server-auth] Found projectId: ${!!serviceAccount.projectId}, clientEmail: ${!!serviceAccount.clientEmail}, privateKey: ${!!serviceAccount.privateKey}`);
    // This will cause an error downstream, which is intended if config is missing.
  }
  
  if (getApps().length > 0) {
    console.log('[v3] [server-auth] Firebase Admin SDK already initialized.');
    return getApps()[0];
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('[v3] [server-auth] Firebase Admin SDK initialized successfully.');
    return app;
  } catch (e: any) {
    console.error('[v3] [server-auth] Firebase Admin SDK initialization failed:', e.message);
    throw e; // Re-throw the error to make it visible
  }
}

const COOKIE_NAME = '__session';

export function clearSessionCookie(response: NextResponse) {
  console.log('[v3] [server-auth] Attempting to clear session cookie.');
  response.cookies.delete(COOKIE_NAME);
  console.log('[v3] [server-auth] Session cookie cleared from response.');
}

export async function getSession(): Promise<DecodedIdToken | null> {
  const app = initializeFirebaseAdmin();
  
  const cookieValue = cookies().get(COOKIE_NAME)?.value;
  if (!cookieValue) {
    console.log('[v3] [server-auth] Session cookie not found in request.');
    return null;
  }

  try {
    console.log('[v3] [server-auth] Found session cookie. Attempting to verify...');
    const decodedIdToken = await getAuth(app).verifySessionCookie(cookieValue, true);
    console.log(`[v3] [server-auth] Session cookie verified for UID: ${decodedIdToken.uid}`);
    return decodedIdToken;
  } catch (error: any) {
    console.error(`[v3] [server-auth] Error verifying session cookie: ${error.code} - ${error.message}`);
    // Manually clear the invalid cookie
    cookies().delete(COOKIE_NAME);
    console.log('[v3] [server-auth] Deleted invalid session cookie.');
    return null;
  }
}
