
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Map, List, Navigation } from 'lucide-react';

// Placeholder data - in a real app, this would come from an API
const samplePharmacies = [
  { id: 1, name: 'Wellness Pharmacy', distance: '1.2 km', lat: 28.6139, lng: 77.2090 },
  { id: 2, name: 'HealthFirst Meds', distance: '2.5 km', lat: 28.6150, lng: 77.2195 },
  { id: 3, name: 'CarePlus Drugstore', distance: '3.1 km', lat: 28.6100, lng: 77.2100 },
  { id: 4, name: 'City Medicals', distance: '4.8 km', lat: 28.6200, lng: 77.2200 },
];

export function PharmacyFinder() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        err => {
          setError(
            'Location access denied. Please enable location services in your browser to find nearby pharmacies.'
          );
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-[500px] border-border/30 bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Map className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Map View</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='h-full pb-16'>
            {loading && (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Getting your location...</p>
              </div>
            )}
            {error && (
              <div className="flex h-full items-center justify-center p-4">
                <Alert variant="destructive">
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            {location && !error && (
              <div className="flex h-full items-center justify-center rounded-md bg-secondary">
                 <p className="text-muted-foreground">Map integration coming soon.</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            {loading && <p className="text-muted-foreground">Loading pharmacies...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {location && !error && (
              <ul className="space-y-4">
                {samplePharmacies.map(pharmacy => (
                  <li
                    key={pharmacy.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                  >
                    <div>
                      <p className="font-semibold">{pharmacy.name}</p>
                      <p className="text-sm text-muted-foreground">{pharmacy.distance}</p>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
