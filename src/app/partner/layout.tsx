
'use client';

import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PartnerLayout({
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
      } else if (role && role !== 'partner') {
        // Redirect to their correct dashboard if they are not a partner
        router.replace('/dashboard');
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'partner') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying partner access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <PartnerSidebar user={user} />
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
