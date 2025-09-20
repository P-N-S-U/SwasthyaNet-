
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getSession } from '@/lib/firebase/server-auth';

export async function updateProfile(prevState: any, formData: FormData) {
  console.log('[v3] updateProfile server action initiated.');
  const session = await getSession();

  if (!session) {
    const errorMsg = 'Session cookie not found. Please sign in again.';
    console.error(`[v3] updateProfile critical error: ${errorMsg}`);
    return { error: errorMsg, data: null };
  }

  const displayName = formData.get('displayName') as string;
  const photoURL = formData.get('photoURL') as string;

  try {
    console.log(`[v3] Updating profile for user: ${session.uid}`);
    const userRef = doc(db, 'users', session.uid);
    const dataToUpdate: { displayName?: string; photoURL?: string } = {};
    if (displayName) dataToUpdate.displayName = displayName;
    if (photoURL) dataToUpdate.photoURL = photoURL;
    
    if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(userRef, dataToUpdate, { merge: true });
    }

    console.log(`[v3] Profile updated successfully for user: ${session.uid}`);
    revalidatePath('/profile');
    return { error: null, data: 'Profile updated successfully.' };
  } catch (error) {
    console.error('[v3] Error updating profile in Firestore:', error);
    return {
      error: 'Failed to update profile. Please try again.',
      data: null,
    };
  }
}

export async function updateDoctorProfile(prevState: any, formData: FormData) {
  console.log('[v3] updateDoctorProfile server action initiated.');
  const session = await getSession();

  if (!session) {
    const errorMsg = 'Session cookie not found. Please sign in again.';
    console.error(`[v3] updateDoctorProfile critical error: ${errorMsg}`);
    return { error: errorMsg, data: null };
  }
  
  const specialization = formData.get('specialization') as string;
  const clinic = formData.get('clinic') as string;
  const bio = formData.get('bio') as string;
  const experience = formData.get('experience') as string;
  const qualifications = formData.get('qualifications') as string;
  const consultationFee = formData.get('consultationFee') as string;

  try {
    console.log(`[v3] Updating DOCTOR profile for user: ${session.uid}`);
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
    
    console.log(`[v3] DOCTOR profile updated successfully for user: ${session.uid}`);
    revalidatePath('/profile');
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
