
'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileFetcher = async ([, uid, role]) => {
    if (!uid) return null;

    // Fetch base user profile
    const userDocRef = doc(db, 'users', uid);
    let userProfile: any = null;
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            userProfile = docSnap.data();
        }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }

    // If the user is a partner, fetch the detailed partner profile
    if (userProfile && userProfile.role === 'partner') {
        const partnerDocRef = doc(db, 'partners', uid);
        try {
            const partnerDocSnap = await getDoc(partnerDocRef);
            if (partnerDocSnap.exists()) {
                // Merge partner-specific data into the main profile object
                userProfile.partnerProfile = partnerDocSnap.data();
            }
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({ path: partnerDocRef.path, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    }
    
    return userProfile;
};

export function useUserProfile(uid?: string | null) {
  // We get the role from the useAuthState hook to decide if we need to fetch partner data
  const { data, isLoading, error, mutate } = useSWR(
    uid ? ['user-profile', uid] : null,
    (key) => profileFetcher(key),
    { revalidateOnFocus: true }
  );

  return { profile: data, loading: isLoading, error, mutate };
}

    