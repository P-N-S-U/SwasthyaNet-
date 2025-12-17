
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server-auth';
import { getSession } from '@/lib/firebase/server-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApps } from 'firebase/app';


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
    const userRef = adminDb.collection('users').doc(session.uid);
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
        await userRef.set({ ...dataToUpdate }, { merge: true });
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

export async function updatePartnerProfile(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'You must be logged in to update your profile.' };
  }
  
  const licenseNumber = formData.get('licenseNumber') as string;
  const contact = formData.get('contact') as string;
  const street = formData.get('street') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const postalCode = formData.get('postalCode') as string;
  const country = formData.get('country') as string;

  // Construct the full address string from the form parts
  const address = `${street}, ${city}, ${state} ${postalCode}, ${country}`;

  try {
    const userRef = adminDb.collection('users').doc(session.uid);
    
    const profileUpdate: any = {};
    if (licenseNumber) profileUpdate['profile.licenseNumber'] = licenseNumber;
    if (contact) profileUpdate['profile.contact'] = contact;
    
    if (street && city && state && postalCode && country) {
      profileUpdate['profile.address'] = address;
    }
    
    if (Object.keys(profileUpdate).length > 0) {
      await userRef.update(profileUpdate);
    }
    
    revalidatePath('/partner/profile');
    revalidatePath('/partner/dashboard');
    return { error: null, data: 'Business details updated successfully.' };

  } catch (error) {
    console.error('[v3] Error updating partner profile in Firestore:', error);
    return {
      error: 'Failed to update business details. Please try again.',
      data: null,
    };
  }
}


export async function savePartnerLocation(location: { lat: number; lng: number }) {
    const session = await getSession();

    if (!session) {
        return { error: 'You must be logged in to update your profile.' };
    }

    if (!location || !location.lat || !location.lng) {
        return { error: 'Invalid location data provided.' };
    }

    try {
        const userRef = adminDb.collection('users').doc(session.uid);
        // Save the location both at the top level for querying and nested for organization
        await userRef.update({
            'profile.location': {
              lat: location.lat,
              lng: location.lng
            },
            'location': { // New top-level field for querying
              lat: location.lat,
              lng: location.lng
            }
        });
        
        revalidatePath('/partner/profile');
        revalidatePath('/patient/pharmacies');
        return { data: 'Location saved successfully.' };
    } catch (error) {
        console.error('Error saving partner location:', error);
        return { error: 'Failed to save location.' };
    }
}

export async function saveDocumentUrl(url: string) {
    const session = await getSession();

    if (!session) {
        return { error: 'You must be logged in to update your profile.' };
    }
    
    if (!url) {
        return { error: 'No URL provided.' };
    }

    try {
        const userRef = adminDb.collection('users').doc(session.uid);
        // Save under a `documents` map in the profile
        await userRef.update({
            'profile.documents.verification': url
        });

        revalidatePath('/partner/profile');
        return { data: 'Document URL saved successfully.' };
    } catch(e) {
        console.error("Error saving document URL:", e);
        return { error: 'Failed to save document URL.' };
    }
}
