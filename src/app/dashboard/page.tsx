
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
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (role) {
      if (role === 'doctor') {
        setStatus('Redirecting to doctor dashboard...');
        router.replace('/doctor/dashboard');
      } else {
        setStatus('Redirecting to patient dashboard...');
        router.replace('/patient/dashboard');
      }
    } else {
      // Role is still loading or not found, show a message.
      // useAuthState and useUserProfile will fetch it.
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
