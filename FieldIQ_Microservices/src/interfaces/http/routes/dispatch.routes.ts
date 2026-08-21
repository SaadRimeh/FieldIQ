import { Router } from 'express';
import { DispatchController } from '../controllers/DispatchController';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// POST /dispatch — admin assigns a route (TSP optimized)
router.post(
  '/',
  authMiddleware,
  adminOnly,
  DispatchController.validate,
  DispatchController.dispatch,
);

// GET /dispatch/today — all active routes for today (admin map view)
router.get('/today', authMiddleware, adminOnly, DispatchController.getTodayRoutes);

// GET /dispatch/employee/:employeeId/today — employee's route for today
router.get(
  '/employee/:employeeId/today',
  authMiddleware,
  DispatchController.getEmployeeRouteToday,
);

// GET /dispatch/:routeId/tasks — tasks for a route
router.get('/:routeId/tasks', authMiddleware, DispatchController.getRouteTasks);

export default router;
