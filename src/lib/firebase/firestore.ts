
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
    
    const dataToCreate = {
        uid: user.uid,
        displayName: additionalData.displayName || user.displayName,
        email,
        photoURL,
        createdAt: serverTimestamp(),
        role: additionalData.role || 'patient', // Default role to patient
        ...additionalData
    }

    try {
      await setDoc(userRef, dataToCreate, { merge: true });
    } catch (error) {
      console.error('Error creating user document:', error);
      const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'create', requestResourceData: dataToCreate });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  }
}
