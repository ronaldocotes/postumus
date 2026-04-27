"use client";

import { useState, useEffect } from "react";

interface GeolocationData {
  cidade: string | null;
  estado: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationData {
  const [data, setData] = useState<GeolocationData>({
    cidade: null,
    estado: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setData({ cidade: null, estado: null, loading: false, error: "Geolocalização não suportada" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Usar API de geocodificação reversa (OpenStreetMap/Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "Posthumous-App/1.0" } }
          );
          
          if (!response.ok) throw new Error("Erro ao obter localização");
          
          const result = await response.json();
          const address = result.address;
          
          // Extrair cidade e estado
          const cidade = address.city || address.town || address.municipality || address.suburb || null;
          const estado = address.state || address.region || null;
          
          setData({
            cidade,
            estado,
            loading: false,
            error: null,
          });
        } catch (err) {
          setData({
            cidade: null,
            estado: null,
            loading: false,
            error: "Erro ao obter localização",
          });
        }
      },
      (err) => {
        setData({
          cidade: null,
          estado: null,
          loading: false,
          error: err.message || "Permissão negada",
        });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  return data;
}
