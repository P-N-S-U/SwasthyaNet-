
'use client';

import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If not logged in, redirect to auth page
        router.replace('/auth?next=/doctor/dashboard');
      } else if (role && role !== 'doctor') {
        // If logged in but not a doctor, redirect to their correct dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, loading, role, router]);

  // While loading or if the role isn't confirmed yet, show a loader.
  // This prevents the content from flashing before the role check is complete.
  if (loading || !user || !role) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying doctor access...</p>
      </div>
    );
  }
  
  // If the role is confirmed to be 'doctor', render the layout.
  // If the role check determined a non-doctor role, the useEffect will have already initiated a redirect.
  // This check prevents a brief flash of the doctor UI for non-doctor users.
  if (role === 'doctor') {
    return (
      <div className="min-h-screen bg-secondary/30">
        <DoctorSidebar user={user} />
        <main className="md:pl-64">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fallback loader while redirecting
  return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecting...</p>
      </div>
  );
}
