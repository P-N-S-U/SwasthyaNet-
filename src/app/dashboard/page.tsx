
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { getUserRole } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth');
      } else {
        setStatus('Fetching user role...');
        getUserRole(user.uid)
          .then(role => {
            if (role === 'doctor') {
              setStatus('Redirecting to doctor dashboard...');
              router.replace('/doctor/dashboard');
            } else {
              setStatus('Redirecting to patient dashboard...');
              router.replace('/patient/dashboard');
            }
          })
          .catch(() => {
            // Default to patient dashboard on error
            setStatus('Error fetching role, redirecting...');
            router.replace('/patient/dashboard');
          });
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}
