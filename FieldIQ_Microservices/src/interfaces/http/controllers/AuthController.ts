import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticateEmployeeUseCase } from '../../../application/usecases/AuthenticateEmployeeUseCase';
import { PrismaEmployeeRepository } from '../../../infrastructure/database/repositories/PrismaEmployeeRepository';
import { prisma } from '../../../config/database';
import bcrypt from 'bcryptjs';

const employeeRepo = new PrismaEmployeeRepository(prisma);
const authenticateUseCase = new AuthenticateEmployeeUseCase(employeeRepo);

export class AuthController {
  // ── POST /auth/login ──────────────────────────────────────────────────────
  static validate = [
    body('loginCode')
      .isString()
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Login code must be exactly 10 digits'),
  ];

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const result = await authenticateUseCase.execute({
        loginCode: req.body.loginCode,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── POST /auth/employees (Admin: create employee) ─────────────────────────
  static createValidate = [
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name required'),
    body('loginCode')
      .matches(/^\d{10}$/)
      .withMessage('Login code must be exactly 10 digits'),
  ];

  static async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const employee = await employeeRepo.create({
        name: req.body.name,
        rawLoginCode: req.body.loginCode,
        role: req.body.role ?? 'EMPLOYEE',
      });

      // Strip loginCode from response
      const { loginCode: _, ...safeEmployee } = employee;
      res.status(201).json({ success: true, data: safeEmployee });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /auth/employees (Admin: list all) ─────────────────────────────────
  static async listEmployees(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await employeeRepo.findAll();
      const safe = employees.map(({ loginCode: _, ...e }) => e);
      res.status(200).json({ success: true, data: safe });
    } catch (err) {
      next(err);
    }
  }
}
