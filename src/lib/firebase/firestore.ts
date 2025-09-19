import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createUserInFirestore(user) {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
}
