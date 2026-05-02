"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface ClienteHoje {
  clientId: string;
  clientName: string;
  address: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  installmentId: string;
  installmentNumber: number;
  installmentValue: number;
  status: "PENDING" | "OVERDUE";
}

interface Props {
  clientes: ClienteHoje[];
  paidInstallments: Set<string>;
  onCobrar: (cliente: ClienteHoje) => void;
}

export default function CobradorMap({ clientes, paidInstallments, onCobrar }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const validClientes = clientes.filter((c) => c.latitude && c.longitude);
      if (validClientes.length === 0) return;

      const center: [number, number] = [
        validClientes.reduce((acc, c) => acc + c.latitude!, 0) / validClientes.length,
        validClientes.reduce((acc, c) => acc + c.longitude!, 0) / validClientes.length,
      ];

      const map = L.map(containerRef.current!, {
        center,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      const fmt = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

      validClientes.forEach((cliente) => {
        const isPaid = paidInstallments.has(cliente.installmentId);
        const color = isPaid ? "#22c55e" : cliente.status === "OVERDUE" ? "#ef4444" : "#2563eb";

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:bold;">${isPaid ? "✓" : "R$"}</span>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([cliente.latitude!, cliente.longitude!], { icon });

        marker.bindPopup(
          `<div style="min-width:180px;padding:4px;">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px">${cliente.clientName}</p>
            ${cliente.address ? `<p style="color:#6b7280;font-size:12px;margin:0 0 6px">${cliente.address}</p>` : ""}
            <p style="font-size:15px;font-weight:bold;color:#111;margin:0 0 8px">${fmt(cliente.installmentValue)}</p>
            ${!isPaid ? `<button onclick="window.__cobradorOnCobrar('${cliente.clientId}')" style="background:#22c55e;color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:700;font-size:13px;width:100%;cursor:pointer;">Cobrar</button>` : `<p style="color:#22c55e;font-weight:700;text-align:center;">Pago</p>`}
          </div>`
        );

        marker.addTo(map);
      });

      // Global callback for popup button
      (window as any).__cobradorOnCobrar = (clientId: string) => {
        const cliente = validClientes.find((c) => c.clientId === clientId);
        if (cliente) {
          map.closePopup();
          onCobrar(cliente);
        }
      };
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "300px" }} />;
}
