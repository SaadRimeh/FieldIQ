import amqplib from 'amqplib';
import { env } from '../../config/env';

// amqplib v0.10.x changed the return type of connect() from Connection to ChannelModel.
// Using Awaited<ReturnType<...>> ensures the type always matches the actual return,
// regardless of future amqplib type definition changes.
type AmqplibConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqplibChannel = Awaited<ReturnType<AmqplibConnection['createChannel']>>;

export class RabbitMQPublisher {
  private connection: AmqplibConnection | null = null;
  private channel: AmqplibChannel | null = null;
  private _isConnected = false;

  async connect(): Promise<void> {
    this.connection = await amqplib.connect(env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    // Declare durable queues so messages survive broker restarts
    await this.channel.assertQueue(env.RABBITMQ_INVOICE_QUEUE, { durable: true });
    await this.channel.assertQueue(env.RABBITMQ_RESULT_QUEUE, { durable: true });

    this._isConnected = true;

    // Handle connection drops
    this.connection.on('error', (err: Error) => {
      console.error('RabbitMQ connection error:', err.message);
      this._isConnected = false;
    });

    this.connection.on('close', () => {
      console.warn('⚠️  RabbitMQ connection closed');
      this._isConnected = false;
    });
  }

  async publish(queue: string, message: string): Promise<void> {
    if (!this.channel || !this._isConnected) {
      throw new Error('RabbitMQ channel not available');
    }

    this.channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true,          // Message survives broker restart
      contentType: 'application/json',
      timestamp: Date.now(),
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this._isConnected = false;
  }

  isConnected(): boolean {
    return this._isConnected;
  }
}
