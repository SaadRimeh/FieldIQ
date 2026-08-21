import { IRouteRepository } from '../../domain/repositories/IRouteRepository';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import { Task } from '../../domain/entities/Task';
import { haversineKm } from '../services/TspService';
import { getSocketServer, SocketEvents, SocketRooms } from '../../config/socket';

export interface CheckInInput {
  taskId: string;
  employeeId: string;
  currentLat: number;
  currentLng: number;
}

export interface CheckInOutput {
  task: Task;
  nextTask: Task | null;
  pointsAwarded: number;
}

// Geofence radius in kilometres (200 m)
const CHECKIN_RADIUS_KM = 0.2;
const CHECKIN_POINTS = 10;

export class CheckInUseCase {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(input: CheckInInput): Promise<CheckInOutput> {
    const task = await this.routeRepo.findTaskById(input.taskId);
    if (!task) throw new Error('TASK_NOT_FOUND');

    if (task.employeeId !== input.employeeId) {
      throw new Error('TASK_NOT_ASSIGNED_TO_EMPLOYEE');
    }

    if (task.status !== 'PENDING') {
      throw new Error(`TASK_ALREADY_${task.status}`);
    }

    // ── Geofence Check ────────────────────────────────────────────────────────
    const distanceKm = haversineKm(
      input.currentLat,
      input.currentLng,
      task.latitude,
      task.longitude,
    );

    if (distanceKm > CHECKIN_RADIUS_KM) {
      throw new Error(
        `OUT_OF_RANGE: ${(distanceKm * 1000).toFixed(0)}m from destination (max ${CHECKIN_RADIUS_KM * 1000}m)`,
      );
    }

    // ── Persist Check-in ──────────────────────────────────────────────────────
    const updatedTask = await this.routeRepo.checkInTask({
      taskId: input.taskId,
      employeeId: input.employeeId,
      currentLat: input.currentLat,
      currentLng: input.currentLng,
    });

    // Award points
    await this.employeeRepo.incrementPoints(input.employeeId, CHECKIN_POINTS);

    // Find next pending task in route
    const nextTask = await this.routeRepo.findNextPendingTask(task.routeId);

    // ── Broadcast ─────────────────────────────────────────────────────────────
    try {
      const io = getSocketServer();
      const payload = {
        task: updatedTask,
        nextTask,
        checkedInAt: new Date().toISOString(),
      };
      io.to(SocketRooms.admin()).emit(SocketEvents.TASK_CHECKED_IN, payload);
    } catch {
      // Non-fatal
    }

    return {
      task: updatedTask,
      nextTask,
      pointsAwarded: CHECKIN_POINTS,
    };
  }
}
