
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server-auth';
import { getSession } from '@/lib/firebase/server-auth';

// TODO: Replace this with a real geocoding service call (e.g., Google Maps Geocoding API)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  console.log(`[Geocoding Placeholder] "Geocoding" address: ${address}`);
  // This is a placeholder. In a real application, you would use an API 
  // to convert the address string into latitude and longitude.
  // For now, we'll return a fixed location for demonstration purposes if the address contains '123 Main St'.
  if (address.toLowerCase().includes('123 main st')) {
    console.log('[Geocoding Placeholder] Matched placeholder address. Returning fixed coordinates for LA.');
    return { lat: 34.0522, lng: -118.2437 }; // Example: Los Angeles City Hall
  }

  // A real implementation would look something like this:
  /*
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].geometry.location; // { lat, lng }
    }
    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
  */

  console.log('[Geocoding Placeholder] Address did not match placeholder. Returning null.');
  // Return null if no match, simulating a failed geocoding attempt.
  return null;
}


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
    
    if (address) {
      profileUpdate['profile.address'] = address;
      // Geocode the full address string to get lat/lng
      const location = await geocodeAddress(address);
      if (location) {
        profileUpdate['profile.location'] = location;
         console.log(`[Server Action] Geocoded address "${address}" to`, location);
      } else {
        console.warn(`[Server Action] Failed to geocode address: "${address}"`);
        // Decide if you want to return an error here if geocoding fails
      }
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
