import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IRouteRepository } from '../../domain/repositories/IRouteRepository';
import { Invoice } from '../../domain/entities/Invoice';
import { MessageBrokerService } from '../services/MessageBrokerService';
import { getSocketServer, SocketEvents, SocketRooms } from '../../config/socket';

export interface SubmitInvoiceInput {
  taskId: string;
  employeeId: string;
  imageUrl: string;
  amount?: number;
  currency?: string;
}

export interface SubmitInvoiceOutput {
  invoice: Invoice;
  queued: boolean;
}

export class SubmitInvoiceUseCase {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly routeRepo: IRouteRepository,
  ) {}

  async execute(input: SubmitInvoiceInput): Promise<SubmitInvoiceOutput> {
    // ── Validate Task Ownership ───────────────────────────────────────────────
    const task = await this.routeRepo.findTaskById(input.taskId);
    if (!task) throw new Error('TASK_NOT_FOUND');

    if (task.employeeId !== input.employeeId) {
      throw new Error('TASK_NOT_ASSIGNED_TO_EMPLOYEE');
    }

    if (task.status === 'PENDING') {
      throw new Error('MUST_CHECK_IN_BEFORE_INVOICE');
    }

    // ── Persist Invoice ───────────────────────────────────────────────────────
    const invoice = await this.invoiceRepo.create({
      taskId: input.taskId,
      imageUrl: input.imageUrl,
      amount: input.amount,
      currency: input.currency ?? 'USD',
    });

    // ── Mark task as completed ────────────────────────────────────────────────
    await this.routeRepo.completeTask(input.taskId);

    // ── Enqueue for AI Processing ─────────────────────────────────────────────
    let queued = false;
    try {
      await MessageBrokerService.publishInvoiceJob({
        invoiceId: invoice.id,
        imageUrl: invoice.imageUrl,
        taskId: invoice.taskId,
        employeeId: input.employeeId,
      });
      queued = true;
    } catch (err) {
      console.warn('⚠️  Failed to enqueue invoice for AI processing:', err);
    }

    // ── Broadcast ─────────────────────────────────────────────────────────────
    try {
      const io = getSocketServer();
      io.to(SocketRooms.admin()).emit(SocketEvents.INVOICE_SUBMITTED, {
        invoice,
        employeeId: input.employeeId,
        taskLabel: task.label,
        queued,
      });
    } catch {
      // Non-fatal
    }

    return { invoice, queued };
  }
}
