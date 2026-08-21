import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

// ── Known Business Error Codes → HTTP Status Map ─────────────────────────────
const ERROR_MAP: Record<string, { status: number; message: string }> = {
  INVALID_CODE_FORMAT:             { status: 400, message: 'Login code must be exactly 10 digits' },
  INVALID_CREDENTIALS:             { status: 401, message: 'Invalid login code' },
  EMPLOYEE_NOT_FOUND:              { status: 404, message: 'Employee not found or inactive' },
  TASK_NOT_FOUND:                  { status: 404, message: 'Task not found' },
  ROUTE_ALREADY_EXISTS:            { status: 409, message: 'A route already exists for this employee today' },
  TASK_NOT_ASSIGNED_TO_EMPLOYEE:   { status: 403, message: 'This task does not belong to you' },
  MUST_CHECK_IN_BEFORE_INVOICE:    { status: 400, message: 'You must check in before submitting an invoice' },
  INVALID_STOP_COUNT:              { status: 400, message: 'Route must have between 1 and 5 stops' },
  OUT_OF_RANGE:                    { status: 400, message: 'You are too far from the destination to check in' },
};

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Extract known error code from message prefix
  const code = err.message?.split(':')[0]?.trim();
  const known = ERROR_MAP[code];

  if (known) {
    res.status(known.status).json({
      success: false,
      error: known.message,
      code,
      // Include distance detail for OUT_OF_RANGE
      detail: code === 'OUT_OF_RANGE' ? err.message.split(':')[1]?.trim() : undefined,
    });
    return;
  }

  // Validation errors (express-validator)
  if (err.statusCode === 422) {
    res.status(422).json({ success: false, error: err.message });
    return;
  }

  // Log unexpected errors
  console.error('❌ Unhandled error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: env.isDevelopment ? err.stack : undefined,
  });

  res.status(err.statusCode ?? 500).json({
    success: false,
    error: env.isProduction ? 'Internal server error' : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
