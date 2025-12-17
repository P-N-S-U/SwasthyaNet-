'use server';

import { createAdminSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (username === 'admin' && password === 'admin@123') {
      await createAdminSession();
    } else {
      return 'Invalid username or password.';
    }
  } catch (error) {
    if ((error as Error).message.includes('credentialssignin')) {
      return 'Invalid credentials.';
    }
    return 'An unexpected error occurred.';
  }

  redirect('/obviouslynotadmin');
}
