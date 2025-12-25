
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

export default function MapWrapper({ userLocation, pharmacies }: any) {

  const initialCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [20.5937, 78.9629]; // Default to center of India

  return (
    <div id="map-container" className="h-full w-full rounded-md z-10">
      <MapContainer
        center={initialCenter}
        zoom={userLocation ? 14 : 5}
        scrollWheelZoom={true}
        className="h-full w-full rounded-md"
        style={{ zIndex: 10 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <UserMarker userLocation={userLocation} />
        {pharmacies?.map((p: any) => {
          return (
            <Marker key={p.id} position={[p.lat, p.lng]}>
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
