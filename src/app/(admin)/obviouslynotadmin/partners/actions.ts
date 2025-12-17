'use server';

import { adminDb } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';

async function updatePartnerStatus(partnerId: string, newStatus: 'approved' | 'rejected') {
  if (!partnerId) {
    return { error: 'Partner ID is missing.' };
  }

  try {
    const partnerRef = adminDb.collection('partners').doc(partnerId);
    await partnerRef.update({ status: newStatus });

    // Revalidate the path to ensure the UI updates with the new status
    revalidatePath('/obviouslynotadmin/partners');
    
    return { success: `Partner has been ${newStatus}.` };
  } catch (error) {
    console.error(`Error updating partner status to ${newStatus}:`, error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function approvePartner(partnerId: string) {
    return updatePartnerStatus(partnerId, 'approved');
}

export async function rejectPartner(partnerId: string) {
    return updatePartnerStatus(partnerId, 'rejected');
}
