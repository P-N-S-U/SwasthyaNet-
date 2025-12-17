
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { User } from 'firebase/auth';


export async function createUserInFirestore(user: User, additionalData = {}) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      const { email, photoURL, displayName } = user;
      
      const dataToCreate = {
          uid: user.uid,
          displayName: additionalData.displayName || displayName,
          email,
          photoURL,
          createdAt: serverTimestamp(),
          role: 'patient', // Default role
          ...additionalData
      }
  
      await setDoc(userRef, dataToCreate, { merge: true });
    }
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'get' });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function createPartnerInFirestore(user: User, partnerData: any) {
    const partnerRef = doc(db, 'partners', user.uid);
    try {
        const docSnap = await getDoc(partnerRef);
        if (!docSnap.exists()) {
            const dataToCreate = {
                ...partnerData,
                ownerUID: user.uid,
                createdAt: serverTimestamp(),
            };
            await setDoc(partnerRef, dataToCreate);
        }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: partnerRef.path,
            operation: 'create',
            requestResourceData: partnerData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
}

    