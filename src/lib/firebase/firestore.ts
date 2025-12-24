
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
  
      await setDoc(userRef, dataToCreate, { merge: true });
    }
  } catch (serverError: any) {
    console.error('Firestore create user failed:', serverError);
    const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'get' });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function createPartnerInFirestore(user: User, partnerData: any) {
  // Use a batch to ensure atomic writes
  const batch = writeBatch(db);

  // 1. Reference to the document in the 'partners' collection
  const partnerRef = doc(db, 'partners', user.uid);
  const partnerPayload = {
    ...partnerData, // Client-side data (name, type, address, etc.)
    uid: user.uid,
    ownerUID: user.uid,
    email: user.email,
    role: 'partner',
    status: 'pending',
    createdAt: serverTimestamp(),
  };
  console.log('[firestore.ts] Staging write to partners collection with payload:', partnerPayload);
  batch.set(partnerRef, partnerPayload);

  // 2. Reference to the document in the 'users' collection
  const userRef = doc(db, 'users', user.uid);
  const userPayload = {
    role: 'partner',
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
  };
  console.log('[firestore.ts] Staging write to users collection with payload:', userPayload);
  batch.set(userRef, userPayload, { merge: true });


  // 3. Commit the batch
  try {
    console.log('[firestore.ts] Committing batched write for partner and user...');
    await batch.commit();
    console.log('[firestore.ts] Batched write successful.');
  } catch (error) {
    console.error('[firestore.ts] FAILED to commit batched write:', error);
    // Re-throw the error to be caught by the form handler
    throw error;
  }
}
