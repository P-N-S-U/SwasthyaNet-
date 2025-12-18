
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
import { createUserInFirestore, createPartnerInFirestore } from './firestore';

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
    console.error('[v3] [auth.ts] Error in createServerSession:', error.message, error);
    // Even if server session fails, the user is logged in client-side.
    // We can decide how to handle this - for now, we'll log it and proceed.
    return { success: false, error: error.message };
  }
}

export async function signUpWithEmail(
  email,
  password,
  userDocData,
  partnerDocData = null
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // THIS IS THE CRITICAL FIX: Force token refresh to ensure auth state is propagated.
    await user.getIdToken(true);

    await updateProfile(user, {
      displayName: userDocData.displayName,
    });
    
    // Create the associated Firestore document.
    if (userDocData.role === 'partner' && partnerDocData) {
      const finalPartnerData = { ...partnerDocData, ownerUID: user.uid };
      await createPartnerInFirestore(user, finalPartnerData);
    } else {
      await createUserInFirestore(user, userDocData);
    }
    
    // Create the server-side session cookie after all data is written.
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

export async function signInWithGoogle(userDocData = {}, partnerDocData = null) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // THIS IS THE CRITICAL FIX: Force token refresh to ensure auth state is propagated.
    await user.getIdToken(true);

    const isPartner = userDocData.role === 'partner';
    
    // Only create partner doc for partners, otherwise create user doc
    if (isPartner) {
        const finalPartnerData = {
            ...(partnerDocData || {}),
            name: partnerDocData?.name || user.displayName,
            ownerUID: user.uid,
        };
        await createPartnerInFirestore(user, finalPartnerData);
    } else {
        const finalUserDocData = { role: 'patient', ...userDocData };
        await createUserInFirestore(user, finalUserDocData);
    }

    await createServerSession(user);

    return { user, error: null };
  } catch (error) {
    console.error('[v3] [auth.ts] Error during Google sign-in:', error);
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    // Immediately sign out on the client
    await firebaseSignOut(auth);
    console.log('[v3] [auth.ts] Client-side sign out complete.');

    // Fire-and-forget the server-side session clearing
    fetch('/api/auth/session', { method: 'DELETE' })
      .then(response => {
        if (!response.ok) {
           console.error('[v3] [auth.ts] Failed to clear server session in background.');
        } else {
           console.log('[v3] [auth.ts] Server session cleared in background.');
        }
      })
      .catch(error => {
        console.error('[v3] Error clearing server session in background:', error);
      });

    return { success: true, error: null };
  } catch (error: any) {
    console.error('[v3] Error signing out:', error.message, error);
    return { success: false, error };
  }
}
