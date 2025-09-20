
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


export async function signUpWithEmail(email, password, additionalData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: additionalData.displayName,
    });

    // Create user document in Firestore
    await createUserInFirestore(user, additionalData);

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
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function sendSignInLink(email: string) {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally so you don't need to ask the user for it again
    // on the same device.
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
      // User opened the link on a different device. To prevent session fixation
      // attacks, ask the user to provide the email again. For simplicity,
      // we'll throw an error here. A real app might prompt for it.
      throw new Error(
        'Email not found. Please try signing in on the same device.'
      );
    }
    const userCredential = await signInWithEmailLink(auth, email, link);
    window.localStorage.removeItem('emailForSignIn');

    const user = userCredential.user;
    // For passwordless sign-in, we need to handle user creation in Firestore if it's their first time.
    await createUserInFirestore(user, { role: 'patient' });

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

    // For Google sign-in, we'll default the role to 'patient'.
    // A more sophisticated app might ask for the role after sign-up.
    const additionalData = { role: 'patient' };
    await createUserInFirestore(user, additionalData);

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}
