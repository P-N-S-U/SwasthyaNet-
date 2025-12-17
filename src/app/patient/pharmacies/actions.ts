
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
      console.log('[SERVER DEBUG] Firestore query returned no documents.');
      return { data: [] };
    }

    console.log(`[SERVER DEBUG] Firestore query returned ${snapshot.docs.length} documents.`);

    const pharmacies = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Defensive checks for all required fields, especially nested ones.
      const hasLocation = data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number';
      const hasProfile = data.profile && typeof data.profile === 'object';

      if (hasLocation && hasProfile) {
        const pharmacyData = {
          id: doc.id,
          name: data.profile.name || 'Unnamed Pharmacy',
          lat: data.location.lat,
          lng: data.location.lng,
          address: data.profile.address || 'Address not available',
        };
        console.log(`[SERVER DEBUG] Found valid pharmacy: ${pharmacyData.name}`);
        return pharmacyData;
      } else {
        console.log(`[SERVER DEBUG] Document ${doc.id} filtered out. HasLocation: ${!!hasLocation}, HasProfile: ${!!hasProfile}`);
        return null;
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null); // Filter out any null entries

    console.log(`[SERVER DEBUG] Returning ${pharmacies.length} valid pharmacies to client.`);
    return { data: pharmacies };

  } catch (e: any) {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}
