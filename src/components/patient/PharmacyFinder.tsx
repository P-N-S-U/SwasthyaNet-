'use client';

import { useState, useEffect, useCallback, useActionState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, List, Navigation, Send } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { findNearbyPharmacies, forwardPrescriptionToPartner } from '@/app/patient/pharmacies/actions';
import { haversineDistance } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const MapWrapper = dynamic(() => import('./MapWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
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

interface PharmacyFinderProps {
    prescriptionId?: string;
    variant?: 'page' | 'dialog';
}

const initialActionState = { success: false, error: null };

function SendButton({ partnerId, prescriptionId }: { partnerId: string; prescriptionId: string }) {
    const [state, formAction, pending] = useActionState(forwardPrescriptionToPartner, initialActionState);
    const { toast } = useToast();

    useEffect(() => {
        if (state.error) {
            toast({ title: 'Error', description: state.error, variant: 'destructive' });
        }
        if (state.success) {
            toast({ title: 'Success', description: 'Your prescription has been forwarded to the pharmacy.' });
        }
    }, [state, toast]);
    
    return (
        <form action={formAction}>
            <input type="hidden" name="partnerId" value={partnerId} />
            <input type="hidden" name="prescriptionId" value={prescriptionId} />
            <Button size="sm" variant="default" type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send
            </Button>
        </form>
    )
}

export function PharmacyFinder({ prescriptionId, variant = 'page' }: PharmacyFinderProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isFetchingPharmacies, setIsFetchingPharmacies] = useState(false);

  const fetchAndSetPharmacies = useCallback(async (location: Location) => {
    setIsFetchingPharmacies(true);
    setError(null);
    console.log('[DEBUG] Calling findNearbyPharmacies with location:', location);
    
    const result = await findNearbyPharmacies(location);
    console.log('[DEBUG] Raw data from findNearbyPharmacies action:', result);


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

      console.log('[DEBUG] Processed and sorted pharmacies with distance:', locationsWithDistance);
      setPharmacies(locationsWithDistance);
    }
    setIsFetchingPharmacies(false);
  }, []);

  useEffect(() => {
    setLoadingLocation(true);
    console.log('[DEBUG] Kicking off location search...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('[DEBUG] Geolocation success:', location);
          setUserLocation(location);
          setLoadingLocation(false);
          // Only fetch pharmacies AFTER location is confirmed.
          fetchAndSetPharmacies(location);
        },
        (err) => {
          console.error('[DEBUG] Geolocation error:', err);
          setError(
            'Location access denied. Please enable location services to find nearby pharmacies.'
          );
          setLoadingLocation(false);
          setIsFetchingPharmacies(false); // Stop loading if location fails
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.log('[DEBUG] Geolocation not supported by browser.');
      setError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      setIsFetchingPharmacies(false);
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
  
  const isPageVariant = variant === 'page';

  return (
    <div className={cn(
        "grid grid-cols-1 gap-8",
        isPageVariant ? "md:grid-cols-3" : "md:grid-cols-5 h-full"
      )}>
      <div className={cn("relative overflow-hidden rounded-lg border border-border/30 bg-background",
         isPageVariant ? "h-[600px] md:col-span-2" : "h-[400px] md:h-full md:col-span-3"
      )}>
          <MapWrapper userLocation={userLocation} pharmacies={pharmacies} />
          
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

      <div className={cn("flex flex-col", isPageVariant ? "md:col-span-1" : "md:col-span-2 h-full")}>
        <Card className="h-full border-border/30 bg-background flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <List className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl md:text-2xl">Nearby Pharmacies</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {isFetchingPharmacies || loadingLocation ? (
              <PharmacyListSkeleton />
            ) : pharmacies.length > 0 ? (
              <ul className="space-y-4">
                {pharmacies.map(pharmacy => {
                  console.log('[DEBUG] Rendering pharmacy in list:', pharmacy.name);
                  return (
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
                        {userLocation && pharmacy.distance && (
                           <p className="text-sm text-muted-foreground">
                              {pharmacy.distance?.toFixed(2)} km away
                           </p>
                        )}
                      </div>
                       <div className="flex gap-2">
                        {prescriptionId ? (
                            <SendButton partnerId={pharmacy.id} prescriptionId={prescriptionId} />
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInGoogleMaps(pharmacy.lat, pharmacy.lng)}
                            >
                                <Navigation className="mr-2 h-4 w-4" />
                                Visit
                            </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
                <p className="pt-10 text-center text-sm text-muted-foreground">
                    {error ? error : "No approved pharmacies found nearby."}
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
