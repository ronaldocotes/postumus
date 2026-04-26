"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const numberIcon = (n: number) => L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#2563eb;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${n}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface ClientMarker {
  id: string;
  name: string;
  address?: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
  cellphone?: string;
  phone?: string;
  order?: number;
}

interface Props {
  clients: ClientMarker[];
  route?: any; // GeoJSON geometry
  center?: [number, number];
  zoom?: number;
  height?: string;
  showNumbers?: boolean;
}

function FitBounds({ clients }: { clients: ClientMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (clients.length > 0) {
      const bounds = L.latLngBounds(clients.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [clients, map]);
  return null;
}

export default function ClientMap({ clients, route, center, zoom = 13, height = "500px", showNumbers = false }: Props) {
  const defaultCenter: [number, number] = center || [0.0346, -51.0694]; // Macapá

  return (
    <MapContainer center={defaultCenter} zoom={zoom} style={{ height, width: "100%", borderRadius: "12px" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clients.length > 0 && <FitBounds clients={clients} />}
      {clients.map((c, i) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={showNumbers && c.order !== undefined ? numberIcon(c.order) : new L.Icon.Default()}
        >
          <Popup>
            <div className="text-sm">
              {showNumbers && c.order !== undefined && <span className="font-bold text-blue-600">#{c.order} - </span>}
              <strong>{c.name}</strong><br />
              {c.address && <span>{c.address}</span>}
              {c.neighborhood && <span>, {c.neighborhood}</span>}
              {(c.cellphone || c.phone) && <><br />{c.cellphone || c.phone}</>}
            </div>
          </Popup>
        </Marker>
      ))}
      {route && (
        <GeoJSON
          data={{ type: "Feature", geometry: route, properties: {} } as any}
          style={{ color: "#2563eb", weight: 4, opacity: 0.7 }}
        />
      )}
    </MapContainer>
  );
}
