import { getAdminSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session?.isAdmin) {
    redirect('/obviouslynotadmin/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <AdminSidebar />
      <main className="md:pl-64">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
