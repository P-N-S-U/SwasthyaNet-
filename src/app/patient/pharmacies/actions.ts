
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
    const partnersRef = adminDb.collection('partners');
    // Query for approved pharmacies that have a location set.
    const q = partnersRef
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
      
      const hasLocation = data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number';
      
      if (hasLocation) {
        const pharmacyData = {
          id: doc.id,
          name: data.name || 'Unnamed Pharmacy',
          lat: data.location.lat,
          lng: data.location.lng,
          address: data.address || 'Address not available',
        };
        console.log(`[SERVER DEBUG] Found valid pharmacy: ${pharmacyData.name}`);
        return pharmacyData;
      } else {
        console.log(`[SERVER DEBUG] Document ${doc.id} filtered out because it's missing a location.`);
        return null;
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    console.log(`[SERVER DEBUG] Returning ${pharmacies.length} valid pharmacies to client.`);
    return { data: pharmacies };

  } catch (e: any) {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}

    