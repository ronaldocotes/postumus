// Simple route optimization using nearest-neighbor algorithm
// For better results, could use Google Maps Directions API or OR-Tools

interface ValidPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Optimize route using nearest-neighbor algorithm starting from current position
 */
export function optimizeRoute<T extends { latitude: number | null; longitude: number | null }>(
  points: T[],
  currentLat?: number,
  currentLng?: number
): T[] {
  const validPoints = points.filter(
    (p): p is T & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null
  );
  if (validPoints.length <= 1) return points;

  const unvisited = [...validPoints];
  const route: T[] = [];

  let currentLat_ = currentLat ?? unvisited[0].latitude;
  let currentLng_ = currentLng ?? unvisited[0].longitude;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(
        currentLat_,
        currentLng_,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const next = unvisited.splice(nearestIndex, 1)[0];
    route.push(next as T);
    currentLat_ = next.latitude;
    currentLng_ = next.longitude;
  }

  // Append points without coordinates at the end
  const withoutGeo = points.filter((p) => p.latitude === null || p.longitude === null);
  return [...route, ...withoutGeo];
}

/**
 * Calculate total route distance in km
 */
export function calculateRouteDistance<T extends { latitude: number | null; longitude: number | null }>(
  points: T[],
  currentLat?: number,
  currentLng?: number
): number {
  const validPoints = points.filter(
    (p): p is T & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null
  );
  if (validPoints.length === 0) return 0;

  let total = 0;
  let lat = currentLat ?? validPoints[0].latitude;
  let lng = currentLng ?? validPoints[0].longitude;

  for (const point of validPoints) {
    total += haversineDistance(lat, lng, point.latitude, point.longitude);
    lat = point.latitude;
    lng = point.longitude;
  }

  return total;
}
