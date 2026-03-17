import { Injectable, Logger } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';
import Redis from 'ioredis';

import { ConfigService } from '../config/config.service';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  private emitter: Emitter | null = null;

  constructor(private readonly config: ConfigService) {
    const redisUri = this.config.get('REDIS_URI');

    if (redisUri) {
      const client = new Redis(redisUri);
      client.on('error', (err) => this.logger.error(`[Redis Emitter] ${err.message}`));
      this.emitter = new Emitter(client);
      this.logger.log('[Socket.IO] Redis emitter initialized');
    }
  }

  publish(roomId: string | string[], eventName: string, data: unknown) {
    if (!this.emitter) {
      this.logger.error('[Socket.IO] Emitter is not initialized');
      return;
    }

    this.logger.debug(`[Socket.IO] Published [${eventName}] event to ${roomId}`);
    this.emitter.to(roomId).emit(eventName, data);
  }

  publishToUser(userId: string, eventName: string, data: unknown) {
    const roomId = `user-${userId}`;
    this.publish(roomId, eventName, data);
  }
}
