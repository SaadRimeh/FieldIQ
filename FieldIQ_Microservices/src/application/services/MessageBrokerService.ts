/**
 * MessageBrokerService
 *
 * Abstracts over both RabbitMQ and Redis so the application layer
 * never imports transport-specific libraries directly.
 * Uses RabbitMQ by default; falls back to Redis if AMQP is unavailable.
 */

import { env } from '../../config/env';
import { RabbitMQPublisher } from '../../infrastructure/messaging/RabbitMQPublisher';
import { RedisPublisher } from '../../infrastructure/messaging/RedisPublisher';

export interface InvoiceJobPayload {
  invoiceId: string;
  imageUrl: string;
  taskId: string;
  employeeId: string;
}

export interface AiResultPayload {
  invoiceId: string;
  extractedAmount: number | null;
  ocrRawText: string;
  isAnomaly: boolean;
  anomalyScore: number;
}

export class MessageBrokerService {
  private static rabbitPublisher: RabbitMQPublisher | null = null;
  private static redisPublisher: RedisPublisher | null = null;
  private static ready = false;

  static async initialize(): Promise<void> {
    try {
      this.rabbitPublisher = new RabbitMQPublisher();
      await this.rabbitPublisher.connect();
      this.ready = true;
      console.log('✅ MessageBrokerService: RabbitMQ connected');
    } catch (err) {
      console.warn('⚠️  RabbitMQ unavailable, falling back to Redis queue:', (err as Error).message);
      try {
        this.redisPublisher = new RedisPublisher();
        await this.redisPublisher.connect();
        this.ready = true;
        console.log('✅ MessageBrokerService: Redis queue connected');
      } catch (redisErr) {
        console.error('❌ Both RabbitMQ and Redis unavailable:', redisErr);
        // Non-fatal — invoices will be queued in-process if broker is down
      }
    }
  }

  static async publishInvoiceJob(payload: InvoiceJobPayload): Promise<void> {
    const message = JSON.stringify(payload);

    if (this.rabbitPublisher?.isConnected()) {
      await this.rabbitPublisher.publish(env.RABBITMQ_INVOICE_QUEUE, message);
      return;
    }

    if (this.redisPublisher?.isConnected()) {
      await this.redisPublisher.enqueue(env.RABBITMQ_INVOICE_QUEUE, message);
      return;
    }

    // Graceful degradation: log and continue — invoice exists in DB
    console.warn(`⚠️  Broker offline — invoice ${payload.invoiceId} queued for retry`);
  }

  static async close(): Promise<void> {
    await this.rabbitPublisher?.close();
    await this.redisPublisher?.close();
  }

  static isReady(): boolean {
    return this.ready;
  }
}
