
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { useEffect } from "react";
import { Button } from "../ui/button";
import { LocateFixed } from "lucide-react";

// Fix for default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const UserMarker = ({ userLocation }: any) => {
    const map = useMap();
    useEffect(() => {
        if (userLocation) {
            map.flyTo([userLocation.lat, userLocation.lng], 14);
        }
    }, [userLocation, map]);

    if (!userLocation) return null;

    // Quick style to make user marker stand out.
    const userIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'user-marker'
    });

    const style = document.createElement('style');
    style.innerHTML = `.user-marker { filter: hue-rotate(120deg) saturate(1.5) brightness(1.1); }`;
    document.head.appendChild(style);


    return (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
    )
}

const RecenterButton = ({ userLocation }: { userLocation: { lat: number, lng: number } | null }) => {
    const map = useMap();

    const handleRecenter = () => {
        if (userLocation) {
            map.flyTo([userLocation.lat, userLocation.lng], 14);
        }
    }

    return (
        <Button 
            onClick={handleRecenter}
            disabled={!userLocation}
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 z-[1000] bg-background/80 backdrop-blur-sm"
            aria-label="Recenter map"
        >
            <LocateFixed className="h-4 w-4" />
        </Button>
    )
}


export default function MapWrapper({ userLocation, pharmacies }: any) {

  const initialCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [20.5937, 78.9629]; // Default to center of India

  const pharmacyIcon = new L.DivIcon({
      html: `<div style="background-color: hsl(var(--primary)); border-radius: 50%; width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg></div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
  });

  return (
    <div id="map-container" className="h-full w-full rounded-md z-10">
      <MapContainer
        center={initialCenter}
        zoom={userLocation ? 14 : 5}
        scrollWheelZoom={true}
        className="h-full w-full rounded-md"
        style={{ zIndex: 10 }}
      >
        <RecenterButton userLocation={userLocation} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <UserMarker userLocation={userLocation} />
        {pharmacies?.map((p: any) => {
          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={pharmacyIcon}>
              <Popup>
                <b>{p.name}</b>
                <br />
                {p.address}
                <br/>
                {p.distance ? `${p.distance.toFixed(2)} km away` : ''}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
