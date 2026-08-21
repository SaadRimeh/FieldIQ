// Domain Entity — DailyRoute + Location

export type RouteStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface LocationPoint {
  label: string;
  latitude: number;
  longitude: number;
}

export interface DailyRoute {
  id: string;
  employeeId: string;
  date: Date;
  status: RouteStatus;
  locationLabels: string[];
  totalDistanceKm: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRouteDTO {
  employeeId: string;
  date: Date;
  locations: LocationPoint[];   // Raw, unoptimized list from admin
}

export interface OptimizedRouteResult {
  route: DailyRoute;
  orderedLocations: LocationPoint[];   // TSP-sorted
  totalDistanceKm: number;
}
