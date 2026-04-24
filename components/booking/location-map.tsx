"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapProps {
  basecamp: { lat: number; lng: number; name: string };
  destination?: { lat: number; lng: number; name: string };
  distance?: number;
  height?: string;
}

export function LocationMap({ basecamp, destination, distance, height = "300px" }: LocationMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className="bg-slate-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-slate-400 text-sm">Loading map...</div>
      </div>
    );
  }

  // Calculate map bounds to show both points
  const bounds = destination
    ? L.latLngBounds([basecamp, destination])
    : L.latLngBounds([basecamp, basecamp]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
        style={{ height, width: "100%" }}
        zoom={12}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Basecamp Marker */}
        <Marker position={[basecamp.lat, basecamp.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-emerald-700">{basecamp.name}</p>
              <p className="text-xs text-slate-600">Basecamp Pengantaran</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        {destination && (
          <>
            <Marker position={[destination.lat, destination.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-blue-700">{destination.name}</p>
                  {distance !== undefined && (
                    <p className="text-xs text-slate-600">Jarak: {distance.toFixed(1)} km</p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Circle showing delivery radius (30km) */}
            <Circle
              center={[basecamp.lat, basecamp.lng]}
              radius={30000} // 30km in meters
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
