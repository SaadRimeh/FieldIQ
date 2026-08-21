import { Invoice, CreateInvoiceDTO, AiInvoiceResultDTO } from '../entities/Invoice';

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByTask(taskId: string): Promise<Invoice[]>;
  findFlagged(): Promise<Invoice[]>;
  findAll(limit?: number, offset?: number): Promise<Invoice[]>;
  create(dto: CreateInvoiceDTO): Promise<Invoice>;
  applyAiResult(dto: AiInvoiceResultDTO): Promise<Invoice>;
  adminReview(id: string, approved: boolean, note?: string): Promise<Invoice>;
  getMonthlyTotals(months: number): Promise<{ month: string; total: number }[]>;
}
