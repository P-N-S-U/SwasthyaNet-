'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This new fetcher is smarter. It first gets the role from the 'users' doc,
// then decides if it needs to make a second fetch from the 'partners' doc.
const profileFetcher = async ([, uid]) => {
  if (!uid) return null;

  const userDocRef = doc(db, 'users', uid);
  let userDoc;
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      userDoc = userDocSnap.data();
    }
  } catch (serverError) {
    // Non-partners might not have a 'users' doc, which is fine, but a permission error is a real error.
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    // For other errors, we can just log and continue, as the user might be a partner.
    console.warn("Could not fetch from 'users' collection for UID:", uid, serverError);
  }

  // If the user document says the role is 'partner', fetch from the partners collection.
  if (userDoc?.role === 'partner') {
    const partnerDocRef = doc(db, 'partners', uid);
    try {
      const partnerDocSnap = await getDoc(partnerDocRef);
      if (partnerDocSnap.exists()) {
        const partnerData = partnerDocSnap.data();
        return {
          ...userDoc, // includes uid, email, photoURL from the users collection
          ...partnerData, // includes name, status, etc. from the partners collection
          role: 'partner',
          displayName: partnerData.name, // The business name is the main display name
          partnerProfile: partnerData, // Keep nested structure for compatibility
        };
      }
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({ path: partnerDocRef.path, operation: 'get' });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  }
  
  // If not a partner, just return the user document (or null if it didn't exist).
  return userDoc || null;
};


export function useUserProfile(uid?: string | null) {
  // The key now only depends on the UID, breaking the circular dependency.
  const { data, isLoading, error, mutate } = useSWR(
    uid ? ['user-profile', uid] : null,
    profileFetcher,
    { revalidateOnFocus: true }
  );

  return { profile: data, loading: isLoading, error, mutate };
}
