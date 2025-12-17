'use server';

import { getSession, adminDb } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

async function verifyAdmin() {
  const session = await getSession();
  if (!session) return false;

  const userDocRef = doc(adminDb, 'users', session.uid);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() && userDoc.data().role === 'admin';
}

export async function updatePartnerStatus(
  partnerId: string,
  status: 'approved' | 'rejected'
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!partnerId || !status) {
    return { success: false, error: 'Missing partner ID or status.' };
  }

  try {
    const partnerRef = doc(adminDb, 'partners', partnerId);
    await updateDoc(partnerRef, { status });

    revalidatePath('/admin/partners');
    return { success: true };
  } catch (error) {
    console.error('Error updating partner status:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}
