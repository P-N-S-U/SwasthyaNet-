
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Map, List, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Skeleton } from '../ui/skeleton';

// Fix for default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

const haversineDistance = (
  coords1: { lat: number; lng: number },
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isFetchingPharmacies, setIsFetchingPharmacies] = useState(false);

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
            'Location access denied. Please enable location services in your browser.'
          );
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      const fetchPharmacies = async () => {
        setIsFetchingPharmacies(true);
        const radius = 5000; // 5km
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${location.lat},${location.lng})[amenity=pharmacy];out;`;

        try {
          const response = await fetch(overpassUrl);
          const data = await response.json();
          const pharmaciesWithDistance = data.elements
            .map((p: Pharmacy) => ({
              ...p,
              distance: haversineDistance(location, p),
            }))
            .sort((a, b) => a.distance - b.distance);
          setPharmacies(pharmaciesWithDistance);
        } catch (e) {
          setError('Could not fetch pharmacy data. Please try again later.');
        } finally {
          setIsFetchingPharmacies(false);
        }
      };
      fetchPharmacies();
    }
  }, [location]);

  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  const PharmacyListSkeleton = () => (
    <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className='w-full'>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-9 w-20" />
            </div>
        ))}
    </div>
  );

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
          <CardContent className="h-full pb-16">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Getting your location...</p>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-4">
                <Alert variant="destructive">
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : location ? (
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={14}
                className="h-full w-full rounded-md"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>Your Location</Popup>
                </Marker>
                {pharmacies.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lon]}>
                    <Popup>
                      <b>{p.tags.name || 'Pharmacy'}</b>
                      <br />
                      {p.distance?.toFixed(2)} km away
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : null}
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
            {isFetchingPharmacies ? (
                <PharmacyListSkeleton />
            ) : error ? (
                <p className="text-destructive text-sm">{error}</p>
            ) : pharmacies.length > 0 ? (
              <ul className="space-y-4">
                {pharmacies.map(pharmacy => (
                  <li
                    key={pharmacy.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                  >
                    <div className="max-w-[70%]">
                      <p className="font-semibold truncate" title={pharmacy.tags.name || 'Unnamed Pharmacy'}>{pharmacy.tags.name || 'Unnamed Pharmacy'}</p>
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
                <p className="text-muted-foreground text-sm text-center pt-10">No pharmacies found within 5km.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
