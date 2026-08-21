import { PrismaClient } from '@prisma/client';
import { IRouteRepository } from '../../../domain/repositories/IRouteRepository';
import { DailyRoute, CreateRouteDTO } from '../../../domain/entities/DailyRoute';
import { Task, CreateTaskDTO, CheckInTaskDTO } from '../../../domain/entities/Task';

function mapRoute(p: any): DailyRoute {
  return {
    id: p.id,
    employeeId: p.employeeId,
    date: p.date,
    status: p.status as DailyRoute['status'],
    locationLabels: p.locationLabels,
    totalDistanceKm: p.totalDistanceKm,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function mapTask(p: any): Task {
  return {
    id: p.id,
    routeId: p.routeId,
    employeeId: p.employeeId,
    label: p.label,
    latitude: p.latitude,
    longitude: p.longitude,
    sequence: p.sequence,
    status: p.status as Task['status'],
    checkedInAt: p.checkedInAt,
    completedAt: p.completedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaRouteRepository implements IRouteRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Routes ────────────────────────────────────────────────────────────────

  async findRouteById(id: string): Promise<DailyRoute | null> {
    const r = await this.db.dailyRoute.findUnique({ where: { id } });
    return r ? mapRoute(r) : null;
  }

  async findRouteByEmployeeAndDate(employeeId: string, date: Date): Promise<DailyRoute | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const r = await this.db.dailyRoute.findFirst({
      where: {
        employeeId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });
    return r ? mapRoute(r) : null;
  }

  async findActiveRoutesByDate(date: Date): Promise<DailyRoute[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.db.dailyRoute.findMany({
      where: {
        status: 'ACTIVE',
        date: { gte: startOfDay, lte: endOfDay },
      },
      // No include needed: mapRoute() projects only DailyRoute fields.
      // Add include: { employee: true } here only if the endpoint response
      // is extended to carry employee details.
    });
    return records.map(mapRoute);
  }

  async createRoute(
    dto: CreateRouteDTO & { totalDistanceKm: number },
  ): Promise<DailyRoute> {
    const labels = dto.locations.map((l) => l.label);
    const r = await this.db.dailyRoute.create({
      data: {
        employeeId: dto.employeeId,
        date: dto.date,
        locationLabels: labels,
        totalDistanceKm: dto.totalDistanceKm,
        status: 'ACTIVE',
      },
    });
    return mapRoute(r);
  }

  async completeRoute(routeId: string): Promise<void> {
    await this.db.dailyRoute.update({
      where: { id: routeId },
      data: { status: 'COMPLETED' },
    });
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async findTaskById(id: string): Promise<Task | null> {
    const t = await this.db.task.findUnique({ where: { id } });
    return t ? mapTask(t) : null;
  }

  async findTasksByRoute(routeId: string): Promise<Task[]> {
    const records = await this.db.task.findMany({
      where: { routeId },
      orderBy: { sequence: 'asc' },
    });
    return records.map(mapTask);
  }

  async findNextPendingTask(routeId: string): Promise<Task | null> {
    const t = await this.db.task.findFirst({
      where: { routeId, status: 'PENDING' },
      orderBy: { sequence: 'asc' },
    });
    return t ? mapTask(t) : null;
  }

  async createTask(dto: CreateTaskDTO): Promise<Task> {
    const t = await this.db.task.create({ data: dto });
    return mapTask(t);
  }

  async createManyTasks(tasks: CreateTaskDTO[]): Promise<Task[]> {
    // Prisma createMany doesn't return records — use individual creates in a transaction
    const created = await this.db.$transaction(
      tasks.map((dto) => this.db.task.create({ data: dto })),
    );
    return created.map(mapTask);
  }

  async checkInTask(dto: CheckInTaskDTO): Promise<Task> {
    const t = await this.db.task.update({
      where: { id: dto.taskId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
    });
    return mapTask(t);
  }

  async completeTask(taskId: string): Promise<Task> {
    const t = await this.db.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    return mapTask(t);
  }

  async skipTask(taskId: string): Promise<Task> {
    const t = await this.db.task.update({
      where: { id: taskId },
      data: { status: 'SKIPPED' },
    });
    return mapTask(t);
  }
}
