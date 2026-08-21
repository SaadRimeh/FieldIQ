import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// POST /auth/login — public
router.post('/login', AuthController.validate, AuthController.login);

// POST /auth/employees — admin creates an employee account
router.post(
  '/employees',
  authMiddleware,
  adminOnly,
  AuthController.createValidate,
  AuthController.createEmployee,
);

// GET /auth/employees — admin lists employees
router.get(
  '/employees',
  authMiddleware,
  adminOnly,
  AuthController.listEmployees,
);

export default router;
