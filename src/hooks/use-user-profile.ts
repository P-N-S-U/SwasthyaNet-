'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This fetcher is now ONLY for patients and doctors from the 'users' collection.
const profileFetcher = async ([, uid]: [string, string | undefined]) => {
  if (!uid) return null;

  const userDocRef = doc(db, 'users', uid);
  
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;

  } catch (serverError: any) {
    console.error(`[use-user-profile] Firestore fetch failed for UID: ${uid}`, serverError);
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: `users/${uid}`, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw serverError;
  }
};


export function useUserProfile(uid?: string | null, enabled: boolean = true) {
  const { data, isLoading, error, mutate } = useSWR(
    uid && enabled ? ['user-profile', uid] : null,
    profileFetcher,
    { 
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );

  return { profile: data, loading: isLoading, error, mutate };
}
