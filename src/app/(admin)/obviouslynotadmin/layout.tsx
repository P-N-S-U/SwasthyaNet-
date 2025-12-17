import { getAdminSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { headers } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const pathname = headers().get('next-url') || '';

  // If there's no admin session AND the user is not already on the login page,
  // redirect them to the login page. This prevents the redirect loop.
  if (!session?.isAdmin && !pathname.includes('/login')) {
    redirect('/obviouslynotadmin/login');
  }

  // If the user IS an admin but tries to access the login page, redirect them to the dashboard.
  if (session?.isAdmin && pathname.includes('/login')) {
    redirect('/obviouslynotadmin');
  }

  // If the user is not an admin, we don't want to render the sidebar or main content,
  // we just let the login page child render.
  if (!session?.isAdmin) {
    return <div className="bg-gray-900">{children}</div>;
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
