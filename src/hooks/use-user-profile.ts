
'use client';

import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileFetcher = async ([, uid]) => {
    if (!uid) return null;
    const userDocRef = doc(db, 'users', uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
};

export function useUserProfile(uid?: string | null) {
  const { data: profile, isLoading: loading, error, mutate } = useSWR(
    uid ? ['user-profile', uid] : null,
    profileFetcher,
    { revalidateOnFocus: true }
  );

  return { profile, loading, error, mutate };
}
