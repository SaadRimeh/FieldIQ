import { IRouteRepository } from '../../domain/repositories/IRouteRepository';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import { LocationPoint, OptimizedRouteResult } from '../../domain/entities/DailyRoute';
import { Task } from '../../domain/entities/Task';
import { solveTsp } from '../services/TspService';
import { getSocketServer, SocketEvents, SocketRooms } from '../../config/socket';

export interface DispatchInput {
  employeeId: string;
  date: Date;
  locations: LocationPoint[];   // 1–5 stops
  originLat: number;            // Admin-selected or employee depot lat
  originLng: number;
}

export interface DispatchOutput {
  result: OptimizedRouteResult;
  tasks: Task[];
}

const MAX_STOPS = 5;

export class DispatchRouteUseCase {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(input: DispatchInput): Promise<DispatchOutput> {
    // ── Validation ────────────────────────────────────────────────────────────
    if (input.locations.length === 0 || input.locations.length > MAX_STOPS) {
      throw new Error(`INVALID_STOP_COUNT: Must be 1–${MAX_STOPS} stops`);
    }

    const employee = await this.employeeRepo.findById(input.employeeId);
    if (!employee || !employee.isActive) {
      throw new Error('EMPLOYEE_NOT_FOUND');
    }

    // Check for existing route on the same date
    const existing = await this.routeRepo.findRouteByEmployeeAndDate(
      input.employeeId,
      input.date,
    );
    if (existing) {
      throw new Error('ROUTE_ALREADY_EXISTS');
    }

    // ── TSP Optimization ──────────────────────────────────────────────────────
    const { orderedLocations, totalDistanceKm } = solveTsp(
      input.locations,
      input.originLat,
      input.originLng,
    );

    // ── Persist Route ─────────────────────────────────────────────────────────
    const route = await this.routeRepo.createRoute({
      employeeId: input.employeeId,
      date: input.date,
      locations: orderedLocations,
      totalDistanceKm,
    });

    // ── Persist Tasks (one per stop) ──────────────────────────────────────────
    const taskDtos = orderedLocations.map((loc, index) => ({
      routeId: route.id,
      employeeId: input.employeeId,
      label: loc.label,
      latitude: loc.latitude,
      longitude: loc.longitude,
      sequence: index + 1,
    }));

    const tasks = await this.routeRepo.createManyTasks(taskDtos);

    const result: OptimizedRouteResult = {
      route,
      orderedLocations,
      totalDistanceKm,
    };

    // ── Broadcast via Socket.io ───────────────────────────────────────────────
    try {
      const io = getSocketServer();
      const payload = {
        routeId: route.id,
        employeeId: input.employeeId,
        orderedLocations,
        totalDistanceKm,
        tasks,
        dispatchedAt: new Date().toISOString(),
      };

      // Notify the specific employee
      io.to(SocketRooms.employee(input.employeeId)).emit(
        SocketEvents.ROUTE_ASSIGNED,
        payload,
      );

      // Notify all admin watchers
      io.to(SocketRooms.admin()).emit(SocketEvents.ROUTE_ASSIGNED, payload);
    } catch {
      // Socket not yet initialized in tests — non-fatal
    }

    return { result, tasks };
  }
}
