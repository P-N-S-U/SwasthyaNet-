
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getSession } from '@/lib/firebase/server-auth';

export async function updateDoctorProfile(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'You must be logged in to update your profile.' };
  }
  
  const specialization = formData.get('specialization') as string;
  const clinic = formData.get('clinic') as string;
  const bio = formData.get('bio') as string;
  const experience = formData.get('experience') as string;
  const qualifications = formData.get('qualifications') as string;
  const consultationFee = formData.get('consultationFee') as string;

  try {
    const userRef = doc(db, 'users', session.uid);
    const dataToUpdate: {
        specialization?: string;
        clinic?: string;
        bio?: string;
        experience?: number;
        qualifications?: string;
        consultationFee?: number;
    } = {};

    if (specialization) dataToUpdate.specialization = specialization;
    if (clinic) dataToUpdate.clinic = clinic;
    if (bio) dataToUpdate.bio = bio;
    if (experience) dataToUpdate.experience = parseInt(experience, 10);
    if (qualifications) dataToUpdate.qualifications = qualifications;
    if (consultationFee) dataToUpdate.consultationFee = parseFloat(consultationFee);
    
    if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(userRef, dataToUpdate, { merge: true });
    }
    
    revalidatePath('/doctor/profile');
    revalidatePath('/doctor/dashboard');
    return { error: null, data: 'Professional profile updated successfully.' };

  } catch (error) {
    console.error('[v3] Error updating doctor profile in Firestore:', error);
    return {
      error: 'Failed to update professional profile. Please try again.',
      data: null,
    };
  }
}
