'use client';

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
