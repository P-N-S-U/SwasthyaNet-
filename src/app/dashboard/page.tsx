
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
  const { user, role, loading } = useAuthState();
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    // Don't do anything until loading is false
    if (loading) {
      return;
    }

    // If loading is done and there's no user, send to login
    if (!user) {
      router.replace('/auth');
      return;
    }

    // If we have a user and a role, redirect them
    if (role) {
      if (role === 'doctor') {
        setStatus('Redirecting to doctor dashboard...');
        router.replace('/doctor/dashboard');
      } else if (role === 'partner') {
        setStatus('Redirecting to partner dashboard...');
        router.replace('/partner/dashboard');
      } else { // 'patient'
        setStatus('Redirecting to patient dashboard...');
        router.replace('/patient/dashboard');
      }
    } else {
      // This state can happen briefly while the role is being fetched by useUserProfile.
      // We show a message and the hook will eventually provide the role, triggering a re-render and the redirect.
      setStatus('Verifying user role...');
    }
    
  }, [user, role, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}
