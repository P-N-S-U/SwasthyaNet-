'use server';

interface Location {
  lat: number;
  lng: number;
}

export async function findNearbyPharmacies(location: Location | null) {
  if (!location) {
    return { error: 'User location is not available.' };
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Google Places API] API key is missing.');
    return { error: 'Google Maps API key is missing on the server.' };
  }

  const { lat, lng } = location;
  const radius = 5000; // 5km
  const type = 'pharmacy';
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('[Google Places API Error]', data);
        throw new Error(data.error_message || `Google Places API returned status: ${data.status}`);
    }
    
    const pharmacies = (data.results || []).map((p: any) => ({
        id: p.place_id,
        name: p.name,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        address: p.vicinity,
    }));
    
    console.log(`[Server Action] Found ${pharmacies.length} pharmacies.`);
    return { data: pharmacies };

  } catch (e: any) {
    console.error('Error in findNearbyPharmacies action:', e);
    return { error: 'Could not fetch location data. Please try again later.' };
  }
}
