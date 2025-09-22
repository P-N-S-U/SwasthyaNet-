
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
        router.replace('/auth');
      } else if (role !== 'doctor') {
        router.replace('/patient/dashboard');
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'doctor') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying doctor access...</p>
      </div>
    );
  }

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
