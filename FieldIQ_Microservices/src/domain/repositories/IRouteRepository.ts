import { DailyRoute, CreateRouteDTO } from '../entities/DailyRoute';
import { Task, CreateTaskDTO, CheckInTaskDTO } from '../entities/Task';

export interface IRouteRepository {
  // Route operations
  findRouteById(id: string): Promise<DailyRoute | null>;
  findRouteByEmployeeAndDate(employeeId: string, date: Date): Promise<DailyRoute | null>;
  findActiveRoutesByDate(date: Date): Promise<DailyRoute[]>;
  createRoute(dto: CreateRouteDTO & { totalDistanceKm: number }): Promise<DailyRoute>;
  completeRoute(routeId: string): Promise<void>;

  // Task operations
  findTaskById(id: string): Promise<Task | null>;
  findTasksByRoute(routeId: string): Promise<Task[]>;
  findNextPendingTask(routeId: string): Promise<Task | null>;
  createTask(dto: CreateTaskDTO): Promise<Task>;
  checkInTask(dto: CheckInTaskDTO): Promise<Task>;
  completeTask(taskId: string): Promise<Task>;
  skipTask(taskId: string): Promise<Task>;

  // Bulk create tasks for a route
  createManyTasks(tasks: CreateTaskDTO[]): Promise<Task[]>;
}
