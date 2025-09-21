
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createUserInFirestore(user, additionalData = {}) {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    const { email, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: additionalData.displayName || user.displayName,
        email,
        photoURL,
        createdAt,
        role: additionalData.role || 'patient', // Default role to patient
        ...additionalData
      }, { merge: true });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
}

export async function getUserRole(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return docSnap.data().role;
  } else {
    // This might happen if the user record wasn't created properly.
    console.warn('No user document found for UID:', userId);
    return null;
  }
}

export async function getUserProfile(userId) {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return null;
    }
}

    