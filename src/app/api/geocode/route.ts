import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Geocode using Nominatim (OpenStreetMap) - free, no API key needed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const clientId = searchParams.get("clientId");

  if (!address) return NextResponse.json({ error: "Endereço obrigatório" }, { status: 400 });

  try {
    const query = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
      { headers: { "User-Agent": "Posthumous-Funeraria/1.0" } }
    );
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ found: false, message: "Endereço não encontrado" });
    }

    const { lat, lon, display_name } = data[0];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // If clientId provided, update the client
    if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { latitude, longitude },
      });
    }

    return NextResponse.json({ found: true, latitude, longitude, displayName: display_name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Batch geocode all clients without coordinates
export async function POST() {
  const clients = await prisma.client.findMany({
    where: {
      active: true,
      address: { not: null },
    },
    select: {
      id: true, address: true, neighborhood: true, city: true, state: true,
      billingAddressSame: true, billingAddress: true, billingNeighborhood: true,
      billingCity: true, billingState: true,
      latitude: true, longitude: true, billingLatitude: true, billingLongitude: true,
    },
    take: 100,
  });

  let geocoded = 0;
  let failed = 0;

  for (const c of clients) {
    // Determine which addresses need geocoding
    const needsHome = !c.latitude && c.address;
    const needsBilling = c.billingAddressSame === false && !c.billingLatitude && c.billingAddress;

    if (!needsHome && !needsBilling) continue;

    // Geocode home address
    if (needsHome) {
      const parts = [c.address, c.neighborhood, c.city, c.state].filter(Boolean);
      const query = encodeURIComponent(parts.join(", "));
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
          { headers: { "User-Agent": "Posthumous-Funeraria/1.0" } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          await prisma.client.update({
            where: { id: c.id },
            data: { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) },
          });
          geocoded++;
        } else { failed++; }
        await new Promise(r => setTimeout(r, 1100));
      } catch { failed++; }
    }

    // Geocode billing address
    if (needsBilling) {
      const parts = [c.billingAddress, c.billingNeighborhood, c.billingCity || c.city, c.billingState || c.state].filter(Boolean);
      const query = encodeURIComponent(parts.join(", "));
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
          { headers: { "User-Agent": "Posthumous-Funeraria/1.0" } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          await prisma.client.update({
            where: { id: c.id },
            data: { billingLatitude: parseFloat(data[0].lat), billingLongitude: parseFloat(data[0].lon) },
          });
          geocoded++;
        } else { failed++; }
        await new Promise(r => setTimeout(r, 1100));
      } catch { failed++; }
    }
  }

  return NextResponse.json({ geocoded, failed, total: clients.length });
}
