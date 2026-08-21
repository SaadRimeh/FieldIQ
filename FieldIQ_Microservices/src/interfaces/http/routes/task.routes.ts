import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// GET /tasks/:taskId
router.get('/:taskId', authMiddleware, TaskController.getTask);

// POST /tasks/:taskId/checkin — employee checks in at location
router.post(
  '/:taskId/checkin',
  authMiddleware,
  TaskController.checkInValidate,
  TaskController.checkIn,
);

// POST /tasks/:taskId/skip — admin skips a task
router.post('/:taskId/skip', authMiddleware, adminOnly, TaskController.skipTask);

export default router;
