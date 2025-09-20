
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getSession } from '@/lib/firebase/session';

export async function updateProfile(prevState: any, formData: FormData) {
  console.log('[testing log] updateProfile server action initiated.');
  const sessionResult = await getSession();

  console.log('[testing log] updateProfile session result:', sessionResult);
  if (sessionResult.error) {
    console.error('[testing log] updateProfile error getting session:', sessionResult.error);
    return {
      error: sessionResult.error,
      data: null,
    };
  }

  const user = sessionResult.user;

  if (!user) {
    const errorMsg = 'User not found in session. This should not happen if sessionResult.error was not set.';
    console.error('[testing log] updateProfile critical error:', errorMsg);
    return {
      error: errorMsg,
      data: null,
    };
  }

  const displayName = formData.get('displayName') as string;
  const photoURL = formData.get('photoURL') as string;

  try {
    console.log(`[testing log] Updating profile for user: ${user.uid}`);
    const userRef = doc(db, 'users', user.uid);
    const dataToUpdate: { displayName?: string; photoURL?: string } = {};
    if (displayName) dataToUpdate.displayName = displayName;
    if (photoURL) dataToUpdate.photoURL = photoURL;
    
    if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(userRef, dataToUpdate, { merge: true });
    }

    console.log(`[testing log] Profile updated successfully for user: ${user.uid}`);
    revalidatePath('/profile');
    return { error: null, data: 'Profile updated successfully.' };
  } catch (error) {
    console.error('[testing log] Error updating profile in Firestore:', error);
    return {
      error: 'Failed to update profile. Please try again.',
      data: null,
    };
  }
}

export async function updateDoctorProfile(prevState: any, formData: FormData) {
  console.log('[testing log] updateDoctorProfile server action initiated.');
  const sessionResult = await getSession();

  console.log('[testing log] updateDoctorProfile session result:', sessionResult);
  if (sessionResult.error) {
    console.error('[testing log] updateDoctorProfile error getting session:', sessionResult.error);
    return {
      error: sessionResult.error,
      data: null,
    };
  }

  const user = sessionResult.user;

  if (!user) {
    const errorMsg = 'User not found in session. This should not happen if sessionResult.error was not set.';
    console.error('[testing log] updateDoctorProfile critical error:', errorMsg);
    return {
      error: errorMsg,
      data: null,
    };
  }
  
  const specialization = formData.get('specialization') as string;
  const clinic = formData.get('clinic') as string;
  const bio = formData.get('bio') as string;
  const experience = formData.get('experience') as string;
  const qualifications = formData.get('qualifications') as string;
  const consultationFee = formData.get('consultationFee') as string;

  try {
    console.log(`[testing log] Updating DOCTOR profile for user: ${user.uid}`);
    const userRef = doc(db, 'users', user.uid);
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
    
    console.log(`[testing log] DOCTOR profile updated successfully for user: ${user.uid}`);
    revalidatePath('/profile');
    revalidatePath('/doctor/dashboard');
    return { error: null, data: 'Professional profile updated successfully.' };

  } catch (error) {
    console.error('[testing log] Error updating doctor profile in Firestore:', error);
    return {
      error: 'Failed to update professional profile. Please try again.',
      data: null,
    };
  }
}
