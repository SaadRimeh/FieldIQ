// Domain Entity — Invoice

export type InvoiceStatus =
  | 'PENDING_REVIEW'
  | 'PROCESSING'
  | 'APPROVED'
  | 'FLAGGED'
  | 'REJECTED';

export interface Invoice {
  id: string;
  taskId: string;
  amount: number | null;
  currency: string;
  imageUrl: string;
  status: InvoiceStatus;
  isAnomaly: boolean;
  anomalyScore: number | null;
  ocrRawText: string | null;
  aiProcessedAt: Date | null;
  adminNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDTO {
  taskId: string;
  imageUrl: string;
  amount?: number;
  currency?: string;
}

export interface AiInvoiceResultDTO {
  invoiceId: string;
  extractedAmount: number | null;
  ocrRawText: string;
  isAnomaly: boolean;
  anomalyScore: number;
}
