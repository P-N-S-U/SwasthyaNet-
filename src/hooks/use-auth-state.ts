'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { useUserProfile } from './use-user-profile';
import { usePartnerProfile } from './use-partner-profile';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isRoleDetermined, setIsRoleDetermined] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setIsRoleDetermined(false);
      setUser(currentUser);
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          const userRole = (tokenResult.claims.role as string) || null;
          setRole(userRole);
        } catch (error) {
          console.error("Error fetching user role from token:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setIsRoleDetermined(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { profile: userProfile, loading: userProfileLoading } = useUserProfile(
    user?.uid,
    role === 'patient' || role === 'doctor'
  );

  const { profile: partnerProfile, loading: partnerProfileLoading } = usePartnerProfile(
    user?.uid,
    role === 'partner'
  );

  const finalProfile = role === 'partner' ? partnerProfile : userProfile;
  const profileIsLoading = role === 'partner' ? partnerProfileLoading : userProfileLoading;

  return {
    user,
    role,
    profile: finalProfile,
    loading: loading || (user && !isRoleDetermined) || (user && profileIsLoading),
  };
}
