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
      return {
        id: doc.id,
        name: data.profile?.name || 'Unnamed Pharmacy',
        lat: data.profile?.location?.lat || 0,
        lng: data.profile?.location?.lng || 0,
        address: data.profile?.address || 'Address not available',
      };
    }).filter(p => p.lat !== 0 && p.lng !== 0); // Filter out pharmacies without a location

    return { data: pharmacies };

  } catch (e: any) => {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}
