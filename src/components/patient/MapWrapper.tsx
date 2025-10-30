"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { useEffect } from "react";

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

    return (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
    )
}

export default function MapWrapper({ userLocation, pharmacies }: any) {
  return (
    <div id="map-container" className="h-full w-full rounded-md z-0">
      <MapContainer
        key={`${userLocation?.lat}-${userLocation?.lng}`} // force reset only when location changes
        center={[userLocation?.lat || 20.5937, userLocation?.lng || 78.9629]}
        zoom={userLocation ? 14 : 5}
        scrollWheelZoom={true}
        className="h-full w-full rounded-md"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <UserMarker userLocation={userLocation} />
        {pharmacies?.map((p: any) => (
          <Marker key={p.id} position={[p.lat, p.lon]}>
            <Popup>
              <b>{p.tags.name || "Unnamed Pharmacy"}</b>
              <br />
              {p.distance?.toFixed(2)} km away
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}