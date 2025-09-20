
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getSession } from '@/lib/firebase/session';

export async function updateProfile(prevState: any, formData: FormData) {
  const { user, error: sessionError } = await getSession();
  if (sessionError) {
    return {
      error: sessionError,
      data: null,
    };
  }

  const displayName = formData.get('displayName') as string;
  const photoURL = formData.get('photoURL') as string;

  try {
    const userRef = doc(db, 'users', user.uid);
    const dataToUpdate: { displayName?: string; photoURL?: string } = {};
    if (displayName) dataToUpdate.displayName = displayName;
    if (photoURL) dataToUpdate.photoURL = photoURL;
    
    if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(userRef, dataToUpdate, { merge: true });
    }

    revalidatePath('/profile');
    return { error: null, data: 'Profile updated successfully.' };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      error: 'Failed to update profile. Please try again.',
      data: null,
    };
  }
}

export async function updateDoctorProfile(prevState: any, formData: FormData) {
  const { user, error: sessionError } = await getSession();
  if (sessionError) {
    return {
      error: sessionError,
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

    revalidatePath('/profile');
    revalidatePath('/doctor/dashboard');
    return { error: null, data: 'Professional profile updated successfully.' };

  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return {
      error: 'Failed to update professional profile. Please try again.',
      data: null,
    };
  }
}
