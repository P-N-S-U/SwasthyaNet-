
'use client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserInFirestore } from './firestore';

const actionCodeSettings = {
  url:
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/finish-signin`
      : 'http://localhost:9002/auth/finish-signin',
  handleCodeInApp: true,
};

// This function is now the single source of truth for creating a server-side session.
// It's called from all sign-in/sign-up methods.
async function createServerSession(user: User) {
  console.log('[v3] [auth.ts] Creating server session for user:', user.uid);
  try {
    const idToken = await user.getIdToken(true);
    console.log('[v3] [auth.ts] ID token retrieved. Calling session API.');

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    console.log('[v3] [auth.ts] Session API response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[v3] [auth.ts] Session API responded with error:', errorData);
      throw new Error(errorData.error || 'Failed to create session.');
    }

    console.log('[v3] [auth.ts] Server session created successfully.');
    return { success: true };
  } catch (error: any) {
    console.error('[v3] [auth.ts] Error in createServerSession:', error.message);
    // Even if server session fails, the user is logged in client-side.
    // We can decide how to handle this - for now, we'll log it and proceed.
    return { success: false, error: error.message };
  }
}

export async function signUpWithEmail(email, password, additionalData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: additionalData.displayName,
    });

    await createUserInFirestore(user, additionalData);
    await createServerSession(user);

    return { user, error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error during email sign-up:', error);
    return { user: null, error };
  }
}

export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createServerSession(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error during email sign-in:', error);
    return { user: null, error };
  }
}

export async function sendSignInLink(email: string) {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    return { error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error sending sign-in link:', error);
    return { error };
  }
}

export function isSignInLink(link: string) {
  return isSignInWithEmailLink(auth, link);
}

export async function completeSignInWithLink(link: string) {
  try {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      throw new Error(
        'Email not found. Please try signing in on the same device.'
      );
    }
    const userCredential = await signInWithEmailLink(auth, email, link);
    window.localStorage.removeItem('emailForSignIn');

    const user = userCredential.user;
    await createUserInFirestore(user, { role: 'patient' });
    await createServerSession(user);

    return { user, error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error completing sign-in with link:', error);
    return { user: null, error };
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const additionalData = { role: 'patient' };
    await createUserInFirestore(user, additionalData);
    await createServerSession(user);

    return { user, error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error during Google sign-in:', error);
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log('[v3] [auth.ts] Client-side sign out complete. Clearing server session...');
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    console.log('[v3] [auth.ts] Server session clear response status:', response.status);
    if (!response.ok) {
      try {
        const responseBody = await response.json();
        console.error('[v3] [auth.ts] Failed to clear server session.', responseBody.error);
        throw new Error(responseBody.error || 'Failed to clear session.');
      } catch (jsonError: any) {
        // If the response is not JSON (e.g., HTML error page), throw a generic error.
        console.error('[v3] [auth.ts] Failed to parse error response from server.', jsonError.message);
        throw new Error('Failed to clear session on server.');
      }
    }
    console.log('[v3] [auth.ts] Server session cleared successfully.');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('[v3] Error signing out:', error.message, error);
    return { success: false, error };
  }
}
