import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { DispatchRouteUseCase } from '../../../application/usecases/DispatchRouteUseCase';
import { PrismaRouteRepository } from '../../../infrastructure/database/repositories/PrismaRouteRepository';
import { PrismaEmployeeRepository } from '../../../infrastructure/database/repositories/PrismaEmployeeRepository';
import { prisma } from '../../../config/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const routeRepo = new PrismaRouteRepository(prisma);
const employeeRepo = new PrismaEmployeeRepository(prisma);
const dispatchUseCase = new DispatchRouteUseCase(routeRepo, employeeRepo);

export class DispatchController {
  // ── POST /dispatch  ───────────────────────────────────────────────────────
  static validate = [
    body('employeeId').isUUID().withMessage('Valid employee ID required'),
    body('date').isISO8601().withMessage('Valid ISO date required'),
    body('originLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid origin latitude'),
    body('originLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid origin longitude'),
    body('locations')
      .isArray({ min: 1, max: 5 })
      .withMessage('locations must be an array of 1–5 items'),
    body('locations.*.label').isString().notEmpty().withMessage('Each location needs a label'),
    body('locations.*.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('locations.*.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
  ];

  static async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { employeeId, date, locations, originLat, originLng } = req.body;

      const output = await dispatchUseCase.execute({
        employeeId,
        date: new Date(date),
        locations,
        // originLat / originLng are already JS numbers after express.json() parses
        // the request body — parseFloat(number) is redundant and misleading.
        originLat,
        originLng,
      });

      res.status(201).json({
        success: true,
        message: `Route dispatched with ${output.tasks.length} stops (${output.result.totalDistanceKm} km total)`,
        data: output,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /dispatch/today  ──────────────────────────────────────────────────
  static async getTodayRoutes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const routes = await routeRepo.findActiveRoutesByDate(new Date());
      res.status(200).json({ success: true, data: routes });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /dispatch/:routeId/tasks  ─────────────────────────────────────────
  static async getRouteTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await routeRepo.findTasksByRoute(req.params.routeId);
      res.status(200).json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /dispatch/employee/:employeeId/today  ─────────────────────────────
  static async getEmployeeRouteToday(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const employeeId = req.params.employeeId;

      // Employees can only see their own route
      if (req.user?.role === 'EMPLOYEE' && req.user.id !== employeeId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      const route = await routeRepo.findRouteByEmployeeAndDate(employeeId, new Date());
      if (!route) {
        res.status(404).json({ success: false, error: 'No route assigned for today' });
        return;
      }

      const tasks = await routeRepo.findTasksByRoute(route.id);
      res.status(200).json({ success: true, data: { route, tasks } });
    } catch (err) {
      next(err);
    }
  }
}
