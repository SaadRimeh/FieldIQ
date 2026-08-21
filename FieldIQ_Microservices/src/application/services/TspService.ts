/**
 * TspService — Travelling Salesman Problem solver using Nearest Neighbour heuristic.
 *
 * Complexity: O(n²) — perfectly adequate for n ≤ 5 stops.
 * Starting from the CLOSEST location to a configurable origin (depot/current position).
 * No overlapping: each node is visited exactly once.
 */

import { LocationPoint } from '../../domain/entities/DailyRoute';

// ─── Haversine Distance ───────────────────────────────────────────────────────

/**
 * Returns the great-circle distance in kilometres between two lat/lng points.
 * Uses the Haversine formula.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Pairwise Distance Matrix ─────────────────────────────────────────────────

function buildDistanceMatrix(points: LocationPoint[]): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineKm(
        points[i].latitude,
        points[i].longitude,
        points[j].latitude,
        points[j].longitude,
      );
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

// ─── Nearest Neighbour TSP ────────────────────────────────────────────────────

export interface TspResult {
  orderedLocations: LocationPoint[];
  totalDistanceKm: number;
}

/**
 * Solves TSP using the Nearest Neighbour heuristic.
 *
 * @param locations  Up to 5 waypoints provided by the admin.
 * @param originLat  Starting latitude (employee depot or admin-defined origin).
 * @param originLng  Starting longitude.
 * @returns Ordered list of locations and total route distance.
 */
export function solveTsp(
  locations: LocationPoint[],
  originLat: number,
  originLng: number,
): TspResult {
  if (locations.length === 0) {
    return { orderedLocations: [], totalDistanceKm: 0 };
  }

  if (locations.length === 1) {
    const d = haversineKm(originLat, originLng, locations[0].latitude, locations[0].longitude);
    return { orderedLocations: [...locations], totalDistanceKm: d };
  }

  const n = locations.length;
  const distMatrix = buildDistanceMatrix(locations);
  const visited = new Array<boolean>(n).fill(false);
  const ordered: LocationPoint[] = [];
  let totalDistance = 0;

  // currentIdx === -1 means we are still at the origin point (not yet at any location node).
  // Tracking the index directly into distMatrix avoids the broken locations.indexOf()
  // approach that compared objects by reference and always returned -1.
  let currentIdx = -1;

  for (let step = 0; step < n; step++) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;

      // If at origin: use haversine from origin coords.
      // Otherwise:   look up pre-computed distance matrix entry.
      const d =
        currentIdx === -1
          ? haversineKm(originLat, originLng, locations[i].latitude, locations[i].longitude)
          : distMatrix[currentIdx][i];

      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx === -1) break;

    // nearestDist already holds the exact distance — no need to recalculate.
    totalDistance += nearestDist;

    visited[nearestIdx] = true;
    ordered.push(locations[nearestIdx]);
    currentIdx = nearestIdx; // advance pointer into distMatrix
  }

  return {
    orderedLocations: ordered,
    totalDistanceKm: parseFloat(totalDistance.toFixed(3)),
  };
}
