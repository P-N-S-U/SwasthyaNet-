
import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
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
      
      const dataToCreate: any = {
          uid: user.uid,
          email,
          photoURL,
          displayName,
          createdAt: serverTimestamp(),
          role: 'patient', // Default role
          ...additionalData
      }
  
      await setDoc(userRef, dataToCreate);
    }
  } catch (serverError: any) {
    console.error('[firestore.ts] FAILED to create user document:', serverError);
    const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'create' });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function createPartnerInFirestore(user: User, partnerData: any) {
  const partnerRef = doc(db, 'partners', user.uid);
  console.log('[firestore.ts] createPartnerInFirestore called for UID:', user.uid);

  try {
    const dataToCreate = {
      ...partnerData,
      uid: user.uid,
      ownerUID: user.uid,
      email: user.email,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    console.log('[firestore.ts] Attempting to write to partners collection with payload:', dataToCreate);
    await setDoc(partnerRef, dataToCreate);
    console.log('[firestore.ts] Successfully wrote to partners collection.');

  } catch (error) {
    console.error('[firestore.ts] FAILED to write to partners collection:', error);
    // Re-throw the error to be caught by the form handler
    throw error;
  }
}
