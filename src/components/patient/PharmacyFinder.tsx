
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, List, Navigation, Pill } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { findNearbyPharmacies } from '@/app/patient/pharmacies/actions';
import { haversineDistance } from '@/lib/utils';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';


const MapWrapper = dynamic(() => import('./MapWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

interface Pharmacy {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distance?: number;
}

interface Location {
  lat: number;
  lng: number;
}

const createPharmacyIcon = () => {
  const iconMarkup = renderToStaticMarkup(
     <div className="rounded-full bg-primary p-2 text-white shadow-lg">
      <Pill className="h-5 w-5" />
    </div>
  );
  return new L.DivIcon({
    html: iconMarkup,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};


export function PharmacyFinder() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isFetchingPharmacies, setIsFetchingPharmacies] = useState(false);
  
  const pharmacyIcon = createPharmacyIcon();

  const fetchAndSetPharmacies = useCallback(async (location: Location) => {
    setIsFetchingPharmacies(true);
    setError(null);
    
    const result = await findNearbyPharmacies(location);

    if (result.error) {
        setError(result.error);
        setPharmacies([]);
    } else if (result.data) {
        const locationsWithDistance = result.data
          .map(p => ({
              ...p,
              distance: haversineDistance(location, { lat: p.lat, lng: p.lng }),
          }))
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setPharmacies(locationsWithDistance);
    }
    setIsFetchingPharmacies(false);
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLoadingLocation(false);
          fetchAndSetPharmacies(location);
        },
        err => {
          setError(
            'Location access denied. Please enable location services in your browser.'
          );
          setLoadingLocation(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
    }
  }, [fetchAndSetPharmacies]);


  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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
      <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg border border-border/30 bg-background md:col-span-2">
          <MapWrapper userLocation={userLocation} pharmacies={pharmacies} pharmacyIcon={pharmacyIcon} />
          
          {loadingLocation && (
             <div className="absolute inset-0 z-20 flex h-full items-center justify-center bg-background/70 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Getting your location...</p>
              </div>
          )}

          {!loadingLocation && error && !userLocation && (
             <div className="absolute inset-0 z-20 flex h-full items-center justify-center bg-background/70 backdrop-blur-sm p-4">
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
              <CardTitle className="font-headline text-xl md:text-2xl">Nearby</CardTitle>
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
                    <div className="max-w-[calc(100%-80px)]">
                      <p
                        className="truncate font-semibold"
                        title={pharmacy.name}
                      >
                        {pharmacy.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pharmacy.distance?.toFixed(2)} km away
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInGoogleMaps(pharmacy.lat, pharmacy.lng)}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Visit
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
                <p className="pt-10 text-center text-sm text-muted-foreground">
                    {error ? error : !userLocation && !loadingLocation ? "Cannot search for pharmacies without your location." : "No approved pharmacies found nearby."}
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
