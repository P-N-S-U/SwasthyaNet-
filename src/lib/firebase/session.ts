
import 'server-only';
import { cookies } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

// This is a server-only module. It can't be used in a client component.

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-8903744107-21905',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

let adminApp: App;

if (!getApps().length) {
    adminApp = initializeApp({
        credential: {
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey,
        },
    });
} else {
    adminApp = getApps()[0];
}


export const adminAuth = getAuth(adminApp);

/**
 * Gets the current user's session from the cookies.
 * This is a server-side utility.
 * @returns The user's session, or null if not authenticated.
 */
export async function getSession(): Promise<DecodedIdToken | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
