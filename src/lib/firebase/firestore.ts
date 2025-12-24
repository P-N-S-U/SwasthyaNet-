
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

  try {
    const dataToCreate = {
      uid: user.uid,
      email: user.email,
      role: 'partner',
      ...partnerData,
      createdAt: serverTimestamp(),
    };

    await setDoc(partnerRef, dataToCreate);

    // Also update the user's role in the 'users' collection for consistent role management
    await setDoc(
      doc(db, 'users', user.uid),
      { role: 'partner',
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

  } catch (error) {
    console.error('Partner creation failed:', error);
    // Re-throw the original error for better debugging in the component.
    throw error;
  }
}
