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
      .where('status', '==', 'approved')
      // This is a standard Firestore workaround to check if a map field exists.
      // We are querying for documents where the location map is greater than a very small value.
      .where('location', '>', { lat: -Infinity, lng: -Infinity });
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return { data: [] };
    }

    const pharmacies = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.profile?.name || 'Unnamed Pharmacy',
        // Use the top-level location for consistency
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        address: data.profile?.address || 'Address not available',
      };
    }).filter(p => p.lat !== 0 && p.lng !== 0); // Filter out pharmacies without a valid location

    return { data: pharmacies };

  } catch (e: any) {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}
