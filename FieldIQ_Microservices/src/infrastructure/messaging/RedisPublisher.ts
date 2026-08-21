import Redis from 'ioredis';
import { env } from '../../config/env';

export class RedisPublisher {
  private client: Redis | null = null;
  private _isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ioredis connects automatically on construction.
      // lazyConnect + manual .connect() can throw "already connecting" in some
      // ioredis versions, so we let the client connect eagerly and resolve on 'ready'.
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
      });

      // Resolve once the connection is fully established
      this.client.once('ready', () => {
        this._isConnected = true;
        resolve();
      });

      // Reject the promise if the very first connection attempt fails
      this.client.once('error', (err) => {
        reject(err);
      });

      // Ongoing event handlers (after the initial connection)
      this.client.on('error', (err) => {
        console.error('Redis error:', err.message);
        this._isConnected = false;
      });

      this.client.on('connect', () => {
        this._isConnected = true;
      });

      this.client.on('close', () => {
        this._isConnected = false;
      });
    });
  }

  /**
   * Enqueue a JSON message using Redis List as a simple FIFO queue.
   * The Python consumer does BRPOP on the same key.
   */
  async enqueue(queue: string, message: string): Promise<void> {
    if (!this.client || !this._isConnected) {
      throw new Error('Redis client not connected');
    }

    // LPUSH + consumer does BRPOP → FIFO queue pattern
    await this.client.lpush(queue, message);
  }

  async close(): Promise<void> {
    await this.client?.quit();
    this._isConnected = false;
  }

  isConnected(): boolean {
    return this._isConnected;
  }
}
