
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

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

let adminApp;
let adminAuth: ReturnType<typeof getAuth>;

console.log('[session.ts] Checking for Firebase Admin config...');
if (isFirebaseAdminConfigured) {
  console.log('[session.ts] Firebase Admin config found. Initializing...');
  if (!getApps().length) {
    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      adminAuth = getAuth(adminApp);
      console.log('[session.ts] Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('[session.ts] Firebase Admin SDK initialization failed:', e.message);
      adminApp = null;
    }
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    console.log('[session.ts] Using existing Firebase Admin app.');
  }
} else {
  console.warn('[session.ts] Firebase Admin config not found. Server-side authentication will be disabled.');
  adminApp = null;
}

export { adminApp, adminAuth };

/**
 * Gets the current user's session from the cookies.
 * Returns the user object if the session is valid, otherwise returns null.
 */
export async function getSession() {
  if (!isFirebaseAdminConfigured || !adminApp) {
      return { user: null, error: "Server authentication not configured. Please check Firebase Admin setup." };
  }

  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return { user: null, error: "Session cookie not found. Please sign in." };
  }

  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { user: decodedIdToken, error: null };
  } catch (error: any) {
    console.error("Error verifying session cookie:", error.message);
    let errorMessage = 'Invalid or expired session. Please sign out and sign back in.';
    if (error.code === 'auth/session-cookie-expired') {
        errorMessage = 'Your session has expired. Please sign out and sign back in.';
    } else if (error.code === 'auth/session-cookie-revoked') {
        errorMessage = 'Your session has been revoked. Please sign out and sign back in.';
    }
    return { user: null, error: errorMessage };
  }
}
