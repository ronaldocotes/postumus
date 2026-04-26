import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Calculate optimal route for a list of client IDs using OSRM
export async function POST(request: NextRequest) {
  const { clientIds, startLat, startLng } = await request.json();

  if (!clientIds || clientIds.length === 0) {
    return NextResponse.json({ error: "Selecione pelo menos um cliente" }, { status: 400 });
  }

  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, name: true, address: true, neighborhood: true, latitude: true, longitude: true,
      cellphone: true, phone: true,
      billingAddressSame: true, billingAddress: true, billingNeighborhood: true,
      billingLatitude: true, billingLongitude: true, billingReference: true,
    },
  });

  if (clients.length === 0) {
    return NextResponse.json({ error: "Nenhum cliente com coordenadas encontrado" }, { status: 400 });
  }

  // Use billing coords when available and different from home
  function getCoords(c: any): { lat: number; lng: number } {
    if (c.billingAddressSame === false && c.billingLatitude && c.billingLongitude) {
      return { lat: c.billingLatitude, lng: c.billingLongitude };
    }
    return { lat: c.latitude, lng: c.longitude };
  }

  // Build coordinates string: start + clients
  const origin = { lat: startLat || 0.0346, lng: startLng || -51.0694 };
  const coords = [
    `${origin.lng},${origin.lat}`,
    ...clients.map(c => { const p = getCoords(c); return `${p.lng},${p.lat}`; }),
  ].join(";");

  try {
    // OSRM trip endpoint (TSP solver) - optimizes order
    const res = await fetch(
      `https://router.project-osrm.org/trip/v1/driving/${coords}?overview=full&geometries=geojson&source=first&roundtrip=false`,
      { headers: { "User-Agent": "Postumus-Funeraria/1.0" } }
    );
    const data = await res.json();

    if (data.code !== "Ok") {
      return NextResponse.json({ error: "Erro ao calcular rota", detail: data.message }, { status: 500 });
    }

    const trip = data.trips[0];
    const waypoints = data.waypoints;

    // Reorder clients based on OSRM optimization
    const orderedClients = waypoints
      .filter((_: any, i: number) => i > 0) // skip origin
      .sort((a: any, b: any) => a.trips_index === b.trips_index ? a.waypoint_index - b.waypoint_index : a.trips_index - b.trips_index)
      .map((wp: any) => {
        const idx = wp.waypoint_index - 1; // -1 because origin is index 0
        return clients[idx] || null;
      })
      .filter(Boolean);

    return NextResponse.json({
      route: {
        geometry: trip.geometry,
        distance: Math.round(trip.distance / 1000 * 10) / 10, // km
        duration: Math.round(trip.duration / 60), // minutes
      },
      orderedClients,
      totalClients: clients.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
