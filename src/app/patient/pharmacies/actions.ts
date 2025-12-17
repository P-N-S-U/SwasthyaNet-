
'use server';
import { adminDb } from '@/lib/firebase/server-auth';

interface Location {
  lat: number;
  lng: number;
}

export async function findNearbyPharmacies(location: Location | null) {
  if (!location) {
    return { error: 'User location is not available.' };
  }

  try {
    const partnersRef = adminDb.collection('users');
    const q = partnersRef
      .where('role', '==', 'partner')
      .where('partnerType', '==', 'pharmacy')
      .where('status', '==', 'approved');
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return { data: [] };
    }

    const pharmacies = snapshot.docs.map(doc => {
      const data = doc.data();
      // The location field must exist and have lat/lng for the pharmacy to be included
      if (data.location && data.location.lat && data.location.lng) {
        return {
          id: doc.id,
          name: data.profile?.name || 'Unnamed Pharmacy',
          lat: data.location.lat,
          lng: data.location.lng,
          address: data.profile?.address || 'Address not available',
        };
      }
      return null;
    }).filter((p): p is NonNullable<typeof p> => p !== null); // Filter out any null entries

    return { data: pharmacies };

  } catch (e: any) {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}
