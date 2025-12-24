
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
  } catch (serverError) {
    console.error('Firestore create user failed:', serverError);
    const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'get' });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function createPartnerInFirestore(user: User, partnerData: any) {
  const partnerRef = doc(db, 'partners', user.uid);
  const userRef = doc(db, 'users', user.uid);

  // 1. Prepare partner document data, ensuring required fields are locked.
  const partnerDataToCreate = {
    ...partnerData,
    uid: user.uid,
    ownerUID: user.uid,
    email: user.email,
    role: 'partner',
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  // 2. Prepare user document data.
  const userDataToCreate = {
    role: 'partner',
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
  };

  // 3. Attempt to write to 'partners' collection
  try {
    console.log('[firestore.ts] Attempting to write to partners collection with payload:', partnerDataToCreate);
    await setDoc(partnerRef, partnerDataToCreate);
    console.log('[firestore.ts] Successfully wrote to partners collection.');
  } catch (error) {
    console.error('[firestore.ts] FAILED to write to partners collection:', error);
    throw error; // Re-throw to be caught by the form handler
  }

  // 4. Attempt to write to 'users' collection
  try {
    console.log('[firestore.ts] Attempting to write to users collection with payload:', userDataToCreate);
    await setDoc(userRef, userDataToCreate, { merge: true });
    console.log('[firestore.ts] Successfully wrote to users collection.');
  } catch (error) {
    console.error('[firestore.ts] FAILED to write to users collection:', error);
    // Note: At this point, the partner doc was created but the user doc failed.
    // This could be handled with a compensating transaction (e.g., delete partner doc), but for now, we just log and throw.
    throw error;
  }
}
