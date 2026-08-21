import { Response, NextFunction } from 'express';
import path from 'path';
import { SubmitInvoiceUseCase } from '../../../application/usecases/SubmitInvoiceUseCase';
import { PrismaInvoiceRepository } from '../../../infrastructure/database/repositories/PrismaInvoiceRepository';
import { PrismaRouteRepository } from '../../../infrastructure/database/repositories/PrismaRouteRepository';
import { prisma } from '../../../config/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AiInvoiceResultDTO } from '../../../domain/entities/Invoice';
import { getSocketServer, SocketEvents, SocketRooms } from '../../../config/socket';
import { env } from '../../../config/env';

const invoiceRepo = new PrismaInvoiceRepository(prisma);
const routeRepo = new PrismaRouteRepository(prisma);
const submitUseCase = new SubmitInvoiceUseCase(invoiceRepo, routeRepo);

export class InvoiceController {
  // ── POST /invoices  ───────────────────────────────────────────────────────
  static async submit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Invoice image is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const imageUrl = `/uploads/${path.basename(req.file.path)}`;

      const result = await submitUseCase.execute({
        taskId: req.body.taskId,
        employeeId: req.user.id,
        imageUrl,
        amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
        currency: req.body.currency ?? 'USD',
      });

      res.status(201).json({
        success: true,
        message: result.queued
          ? 'Invoice submitted and queued for AI processing'
          : 'Invoice submitted (AI queue offline — will retry)',
        data: result.invoice,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /invoices  ────────────────────────────────────────────────────────
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) ?? '50', 10);
      const offset = parseInt((req.query.offset as string) ?? '0', 10);
      const invoices = await invoiceRepo.findAll(limit, offset);
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /invoices/flagged  ────────────────────────────────────────────────
  static async listFlagged(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoices = await invoiceRepo.findFlagged();
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /invoices/:id  ────────────────────────────────────────────────────
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, error: 'Invoice not found' });
        return;
      }
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  // ── POST /invoices/ai-result  (Internal — called by Python AI service) ─────
  // Protected by ADMIN_SECRET header rather than JWT
  static async receiveAiResult(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const secret = req.headers['x-ai-secret'];
    if (secret !== env.ADMIN_SECRET) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    try {
      const dto: AiInvoiceResultDTO = req.body;
      const invoice = await invoiceRepo.applyAiResult(dto);

      // Broadcast AI result to admin dashboard
      try {
        const io = getSocketServer();
        io.to(SocketRooms.admin()).emit(SocketEvents.INVOICE_ANALYZED, invoice);
      } catch { /* non-fatal */ }

      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /invoices/:id/review (Admin) ────────────────────────────────────
  static async adminReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { approved, note } = req.body;
      const invoice = await invoiceRepo.adminReview(req.params.id, approved === true, note);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  // ── GET /invoices/monthly-totals  ─────────────────────────────────────────
  static async monthlyTotals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt((req.query.months as string) ?? '6', 10);
      const totals = await invoiceRepo.getMonthlyTotals(months);
      res.status(200).json({ success: true, data: totals });
    } catch (err) {
      next(err);
    }
  }
}
