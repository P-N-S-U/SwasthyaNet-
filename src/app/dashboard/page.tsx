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
    // Wait until the initial authentication check is complete.
    if (loading) {
      return;
    }

    // If auth check is done and there's no user, redirect to login.
    if (!user) {
      router.replace('/auth');
      return;
    }

    // If we have a user, but are still waiting for their role to be determined.
    if (user && !role) {
      setStatus('Verifying user role...');
      return; // IMPORTANT: Wait for the role to be loaded.
    }

    // Once we have the role, we can perform the correct redirect.
    if (role) {
      switch (role) {
        case 'doctor':
          setStatus('Redirecting to doctor dashboard...');
          router.replace('/doctor/dashboard');
          break;
        case 'partner':
          setStatus('Redirecting to partner dashboard...');
          router.replace('/partner/dashboard');
          break;
        case 'patient':
        default:
          setStatus('Redirecting to patient dashboard...');
          router.replace('/patient/dashboard');
          break;
      }
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
