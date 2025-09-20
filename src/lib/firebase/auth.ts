
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

async function createSessionCookie(user: User) {
  console.log('[auth.ts] Attempting to create session cookie for user:', user.uid);
  try {
    const idToken = await user.getIdToken(true);
    console.log('[auth.ts] ID token retrieved successfully.');

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    console.log('[auth.ts] Session API response status:', response.status);
    const responseBody = await response.json();
    console.log('[auth.ts] Session API response body:', responseBody);

    if (!response.ok) {
      throw new Error(responseBody.error || 'Failed to create session cookie.');
    }
    
    console.log('[auth.ts] Session cookie created successfully via API.');
    return { success: true };
  } catch (error) {
    console.error('[auth.ts] Error creating session cookie:', error);
    // This error is client-side, so we don't want to expose too much.
    // The detailed error is logged to the console.
    return { success: false, error: 'Failed to establish a server session.' };
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
    await createSessionCookie(user);

    return { user, error: null };
  } catch (error) {
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
    await createSessionCookie(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function sendSignInLink(email: string) {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    return { error: null };
  } catch (error) {
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
    await createSessionCookie(user);

    return { user, error: null };
  } catch (error) {
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
    await createSessionCookie(user);

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
     const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    if (!response.ok) {
      const responseBody = await response.json();
      throw new Error(responseBody.error || 'Failed to clear session.');
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
}
