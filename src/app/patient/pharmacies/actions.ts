
'use server';
import { adminDb } from '@/lib/firebase/server-auth';
import { getSession } from '@/lib/firebase/server-auth';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function forwardPrescriptionToPartner(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: 'You must be logged in to perform this action.' };
    }

    const partnerId = formData.get('partnerId') as string;
    const prescriptionId = formData.get('prescriptionId') as string;

    if (!partnerId || !prescriptionId) {
        return { success: false, error: 'Missing required information for forwarding.' };
    }

    try {
        const requestRef = adminDb.collection('prescriptionRequests').doc();
        await requestRef.set({
            prescriptionId,
            partnerId,
            patientId: session.uid,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
        });
        
        return { success: true, error: null };
    } catch(e: any) {
        console.error('Error forwarding prescription:', e);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
    
