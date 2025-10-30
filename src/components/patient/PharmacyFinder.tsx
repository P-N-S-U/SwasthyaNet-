
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, List, Navigation } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const MapWrapper = dynamic(() => import('./MapWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

interface Pharmacy {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    [key: string]: string | undefined;
  };
  distance?: number;
}

interface Location {
  lat: number;
  lng: number;
}

const haversineDistance = (
  coords1: Location,
  coords2: { lat: number; lon: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in km
};

export function PharmacyFinder() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isFetchingPharmacies, setIsFetchingPharmacies] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('[PharmacyFinder] User location found:', location);
          setUserLocation(location);
          setLoadingLocation(false);
        },
        err => {
          console.error('[PharmacyFinder] Geolocation error:', err.message);
          setError(
            'Location access denied. Please enable location services in your browser.'
          );
          setLoadingLocation(false);
        }
      );
    } else {
      console.error('[PharmacyFinder] Geolocation not supported.');
      setError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      const fetchPharmacies = async () => {
        setIsFetchingPharmacies(true);
        console.log('[PharmacyFinder] Fetching pharmacies for location:', userLocation);
        const radius = 5000; // 5km
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["amenity"="pharmacy"](around:${radius},${userLocation.lat},${userLocation.lng});
            way["amenity"="pharmacy"](around:${radius},${userLocation.lat},${userLocation.lng});
            relation["amenity"="pharmacy"](around:${radius},${userLocation.lat},${userLocation.lng});
            node["shop"="chemist"](around:${radius},${userLocation.lat},${userLocation.lng});
            way["shop"="chemist"](around:${radius},${userLocation.lat},${userLocation.lng});
            relation["shop"="chemist"](around:${radius},${userLocation.lat},${userLocation.lng});
          );
          out center;
        `;
        const overpassUrl = `https://overpass-api.de/api/interpreter`;

        try {
          const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': 'SwasthyaNet/1.0 (Web; +https://example.com)',
            },
            body: `data=${encodeURIComponent(overpassQuery)}`,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch from Overpass API: ${response.status} ${response.statusText} - ${errorText}`);
          }
          const data = await response.json();
          console.log('[PharmacyFinder] Raw data from Overpass API:', data);
          
          if (!data.elements || data.elements.length === 0) {
            console.log('[PharmacyFinder] No elements found in Overpass response.');
            setPharmacies([]);
          } else {
            const pharmaciesWithDistance = data.elements
              .map((p: any) => {
                const location = p.type === 'node' ? { lat: p.lat, lon: p.lon } : { lat: p.center.lat, lon: p.center.lon };
                return {
                  ...p,
                  ...location,
                  distance: haversineDistance(userLocation, location),
                }
              })
              .sort((a: Pharmacy, b: Pharmacy) => (a.distance || 0) - (b.distance || 0));
              
            console.log('[PharmacyFinder] Processed and sorted pharmacies:', pharmaciesWithDistance);
            setPharmacies(pharmaciesWithDistance);
          }
        } catch (e: any) {
          console.error("[PharmacyFinder] Error fetching pharmacies:", e.message);
          setError('Could not fetch pharmacy data. The service might be temporarily unavailable.');
        } finally {
          setIsFetchingPharmacies(false);
        }
      };
      fetchPharmacies();
    }
  }, [userLocation]);

  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      '_blank'
    );
  };

  const PharmacyListSkeleton = () => (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
        >
          <div className="w-full">
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2 h-[500px] rounded-lg border border-border/30 bg-background relative overflow-hidden">
          <MapWrapper userLocation={userLocation} pharmacies={pharmacies} />
          
          {loadingLocation && (
             <div className="absolute inset-0 z-10 flex h-full items-center justify-center bg-background/70 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Getting your location...</p>
              </div>
          )}

          {!loadingLocation && error && !userLocation && (
             <div className="absolute inset-0 z-10 flex h-full items-center justify-center bg-background/70 backdrop-blur-sm p-4">
                <Alert variant="destructive">
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
          )}
      </div>

      <div className="md:col-span-1">
        <Card className="h-full border-border/30 bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <List className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Nearby</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isFetchingPharmacies ? (
              <PharmacyListSkeleton />
            ) : pharmacies.length > 0 ? (
              <ul className="space-y-4">
                {pharmacies.map(pharmacy => (
                  <li
                    key={pharmacy.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                  >
                    <div className="max-w-[70%]">
                      <p
                        className="truncate font-semibold"
                        title={pharmacy.tags.name || 'Unnamed Pharmacy'}
                      >
                        {pharmacy.tags.name || 'Unnamed Pharmacy'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pharmacy.distance?.toFixed(2)} km away
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInGoogleMaps(pharmacy.lat, pharmacy.lon)}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Visit
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
                <p className="pt-10 text-center text-sm text-muted-foreground">
                    {!userLocation && !loadingLocation ? "Cannot search for pharmacies without your location." : "No pharmacies found within 5km."}
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
