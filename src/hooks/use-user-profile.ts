'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This fetcher now sequentially checks 'users' then 'partners' to find the correct profile.
const profileFetcher = async ([, uid]: [string, string | undefined]) => {
  if (!uid) return null;

  const userDocRef = doc(db, 'users', uid);
  
  try {
    // 1. First, try to fetch from the 'users' collection for patients/doctors.
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    
    // 2. If not in 'users', check the 'partners' collection.
    const partnerDocRef = doc(db, 'partners', uid);
    const partnerDocSnap = await getDoc(partnerDocRef);

    if (partnerDocSnap.exists()) {
      const partnerData = partnerDocSnap.data();
      // Ensure the returned object has a consistent shape for the UI
      return {
        ...partnerData,
        displayName: partnerData.name, // Map business name to displayName
        partnerProfile: partnerData, // Keep nested for specific partner components
      };
    }

    // 3. If not found in either collection, the profile doesn't exist yet.
    return null;

  } catch (serverError: any) {
    console.error(`[use-user-profile] Firestore fetch failed for UID: ${uid}`, serverError);
    // A permission error is a critical failure that should be reported.
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: `users/${uid} or partners/${uid}`, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw the error to be handled by SWR's error state.
    throw serverError;
  }
};


export function useUserProfile(uid?: string | null) {
  const { data, isLoading, error, mutate } = useSWR(
    uid ? ['user-profile', uid] : null,
    profileFetcher,
    { 
      revalidateOnFocus: true,
      shouldRetryOnError: false, // Prevent retrying on permission errors
    }
  );

  return { profile: data, loading: isLoading, error, mutate };
}
