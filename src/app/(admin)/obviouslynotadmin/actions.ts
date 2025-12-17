'use server';

import { destroyAdminSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function signOut() {
  await destroyAdminSession();
  redirect('/admin-login');
}
