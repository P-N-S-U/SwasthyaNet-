
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export async function createUserInFirestore(user, additionalData = {}) {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef).catch(serverError => {
      const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'get' });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  });

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
      const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'create', requestResourceData: additionalData });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  }
}
