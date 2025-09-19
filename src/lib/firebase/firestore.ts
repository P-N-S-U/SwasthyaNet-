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
        displayName: additionalData.displayName || user.displayName,
        email,
        photoURL,
        createdAt,
        role: additionalData.role || 'patient', // Default role to patient
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
}
