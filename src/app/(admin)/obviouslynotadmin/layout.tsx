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
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || headersList.get('next-url') || '';

  // If there's no admin session AND the user is trying to access a page
  // that is NOT the login page, redirect them.
  if (!session?.isAdmin && !pathname.endsWith('/obviouslynotadmin/login')) {
    redirect('/obviouslynotadmin/login');
  }
  
  // If the user IS an admin and tries to access the login page,
  // redirect them to the main admin dashboard.
  if (session?.isAdmin && pathname.endsWith('/obviouslynotadmin/login')) {
    redirect('/obviouslynotadmin');
  }

  // If the user is not an admin and is accessing the login page,
  // just render the children (the login page).
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
