import { PrismaClient, Prisma } from '@prisma/client';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { Invoice, CreateInvoiceDTO, AiInvoiceResultDTO } from '../../../domain/entities/Invoice';

function mapInvoice(p: any): Invoice {
  return {
    id: p.id,
    taskId: p.taskId,
    amount: p.amount,
    currency: p.currency,
    imageUrl: p.imageUrl,
    status: p.status as Invoice['status'],
    isAnomaly: p.isAnomaly,
    anomalyScore: p.anomalyScore,
    ocrRawText: p.ocrRawText,
    aiProcessedAt: p.aiProcessedAt,
    adminNote: p.adminNote,
    reviewedAt: p.reviewedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

interface MonthlyTotalRow {
  month: string;
  total: bigint;
}

export class PrismaInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Invoice | null> {
    const r = await this.db.invoice.findUnique({ where: { id } });
    return r ? mapInvoice(r) : null;
  }

  async findByTask(taskId: string): Promise<Invoice[]> {
    const records = await this.db.invoice.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapInvoice);
  }

  async findFlagged(): Promise<Invoice[]> {
    const records = await this.db.invoice.findMany({
      where: { isAnomaly: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapInvoice);
  }

  async findAll(limit = 50, offset = 0): Promise<Invoice[]> {
    const records = await this.db.invoice.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapInvoice);
  }

  async create(dto: CreateInvoiceDTO): Promise<Invoice> {
    const r = await this.db.invoice.create({
      data: {
        taskId: dto.taskId,
        imageUrl: dto.imageUrl,
        amount: dto.amount ?? null,
        currency: dto.currency ?? 'USD',
        status: 'PENDING_REVIEW',
      },
    });
    return mapInvoice(r);
  }

  async applyAiResult(dto: AiInvoiceResultDTO): Promise<Invoice> {
    const r = await this.db.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        // Pass null directly — using ?? undefined would silently skip the column update
        // when the AI service couldn't extract an amount.
        amount: dto.extractedAmount,
        ocrRawText: dto.ocrRawText,
        isAnomaly: dto.isAnomaly,
        anomalyScore: dto.anomalyScore,
        status: dto.isAnomaly ? 'FLAGGED' : 'APPROVED',
        aiProcessedAt: new Date(),
      },
    });
    return mapInvoice(r);
  }

  async adminReview(id: string, approved: boolean, note?: string): Promise<Invoice> {
    const r = await this.db.invoice.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        adminNote: note ?? null,
        reviewedAt: new Date(),
      },
    });
    return mapInvoice(r);
  }

  async getMonthlyTotals(months = 6): Promise<{ month: string; total: number }[]> {
    // $queryRaw used as a tagged template literal safely parameterizes interpolations (${months})
    // to prevent SQL injection. make_interval() accepts an integer parameter safely.
    const result = await this.db.$queryRaw<MonthlyTotalRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0)::bigint                    AS total
      FROM invoices
      WHERE
        status IN ('APPROVED', 'FLAGGED')
        AND created_at >= NOW() - make_interval(months => ${months})
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    // Prisma returns numeric aggregations as BigInt — convert to JS number.
    return result.map((r: MonthlyTotalRow) => ({
      month: r.month,
      total: Number(r.total),
    }));
  }
}
