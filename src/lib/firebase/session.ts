
import 'server-only';
import { cookies } from 'next/headers';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';

// This is a server-only module. It can't be used in a client component.

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-8903744107-21905',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

function initializeAdminApp(): App | null {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        try {
            return initializeApp({
                credential: cert(serviceAccount),
            });
        } catch(error: any) {
            console.error("Firebase Admin SDK initialization error:", error.message);
            return null;
        }
    } else {
        // Do not log in production environments
        if (process.env.NODE_ENV !== 'production') {
            console.warn("Firebase Admin SDK not initialized. Missing environment variables. Server-side authentication will be unavailable.");
        }
        return null;
    }
}

const adminApp = initializeAdminApp();
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

type Session = {
    user: DecodedIdToken | null;
    error?: string | null;
}

/**
 * Gets the current user's session from the cookies.
 * This is a server-side utility.
 * @returns The user's session, or null if not authenticated.
 */
export async function getSession(): Promise<Session> {
  // If the adminAuth service is not available, we can't get a session.
  if (!adminAuth) {
    return { user: null, error: 'Server authentication not configured. Please check Firebase Admin setup.' };
  }

  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return { user: null, error: 'Authentication error: Session cookie not found. Please sign out and sign back in.' };
  }

  try {
    // verifySessionCookie() will check if the cookie is valid and not expired.
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { user: decodedIdToken, error: null };
  } catch (error: any) {
    console.error('Error verifying session cookie:', error.message);
    return { user: null, error: 'Authentication error: Session cookie is invalid or expired. Please sign out and sign back in.' };
  }
}
