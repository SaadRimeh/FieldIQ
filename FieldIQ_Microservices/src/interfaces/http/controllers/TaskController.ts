import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { CheckInUseCase } from '../../../application/usecases/CheckInUseCase';
import { PrismaRouteRepository } from '../../../infrastructure/database/repositories/PrismaRouteRepository';
import { PrismaEmployeeRepository } from '../../../infrastructure/database/repositories/PrismaEmployeeRepository';
import { prisma } from '../../../config/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const routeRepo = new PrismaRouteRepository(prisma);
const employeeRepo = new PrismaEmployeeRepository(prisma);
const checkInUseCase = new CheckInUseCase(routeRepo, employeeRepo);

export class TaskController {
  // ── POST /tasks/:taskId/checkin ───────────────────────────────────────────
  static checkInValidate = [
    body('currentLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('currentLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  ];

  static async checkIn(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const result = await checkInUseCase.execute({
        taskId: req.params.taskId,
        employeeId: req.user.id,
        currentLat: parseFloat(req.body.currentLat),
        currentLng: parseFloat(req.body.currentLng),
      });

      res.status(200).json({
        success: true,
        message: `Checked in! +${result.pointsAwarded} points awarded`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /tasks/:taskId ────────────────────────────────────────────────────
  static async getTask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const task = await routeRepo.findTaskById(req.params.taskId);
      if (!task) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      // Employees can only view their own tasks
      if (req.user?.role === 'EMPLOYEE' && task.employeeId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      res.status(200).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  // ── POST /tasks/:taskId/skip (Admin only) ─────────────────────────────────
  static async skipTask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const task = await routeRepo.skipTask(req.params.taskId);
      res.status(200).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }
}
