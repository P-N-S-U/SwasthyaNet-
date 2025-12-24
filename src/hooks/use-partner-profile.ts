'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This fetcher is ONLY for partners from the 'partners' collection.
const partnerProfileFetcher = async ([, uid]: [string, string | undefined]) => {
  if (!uid) return null;

  const partnerDocRef = doc(db, 'partners', uid);
  
  try {
    const partnerDocSnap = await getDoc(partnerDocRef);

    if (partnerDocSnap.exists()) {
      const partnerData = partnerDocSnap.data();
      // Ensure the returned object has a consistent shape for the UI
      return {
        ...partnerData,
        displayName: partnerData.name, // Map business name to displayName
        // This makes it easy for components to access partner-specific data
        partnerProfile: partnerData, 
      };
    }
    
    // If not found, the profile doesn't exist yet.
    return null;

  } catch (serverError: any) {
    console.error(`[use-partner-profile] Firestore fetch failed for UID: ${uid}`, serverError);
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: `partners/${uid}`, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw serverError;
  }
};


export function usePartnerProfile(uid?: string | null, enabled: boolean = true) {
  const { data, isLoading, error, mutate } = useSWR(
    uid && enabled ? ['partner-profile', uid] : null,
    partnerProfileFetcher,
    { 
      revalidateOnFocus: true,
      shouldRetryOnError: false, // Prevent retrying on permission errors
    }
  );

  return { profile: data, loading: isLoading, error, mutate };
}
