import { getSession } from '@/lib/firebase/server-auth';
import { notFound } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase/server-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

async function verifyAdminAccess() {
  const session = await getSession();
  if (!session) {
    return false;
  }

  try {
    const userDocRef = doc(adminDb, 'users', session.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await verifyAdminAccess();

  if (!isAdmin) {
    notFound(); // This will render the not-found page, effectively blocking access
  }

  const session = await getSession(); // We know session is valid here

  return (
    <div className="min-h-screen bg-secondary/30">
      <AdminSidebar user={session!} />
      <main className="md:pl-64">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
