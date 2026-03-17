import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { COOKIES } from 'app-constants';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

import { ConfigService } from '../config/config.service';

function getCookie(cookieString: string, name: string): string | null {
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);

  if (parts && parts.length === 2) {
    const part = parts.pop();
    if (!part) return null;
    return part.split(';').shift() ?? null;
  }

  return null;
}

function checkAccessToRoom(roomId: string, data: { userId: string }): boolean {
  const [roomType, ...rest] = roomId.split('-');
  const id = rest.join('-');

  switch (roomType) {
    case 'user':
      return id === data.userId;
    default:
      return false;
  }
}

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server!: Server;

  private validateAccessToken!: (token: string | null | undefined) => Promise<{ userId: string } | null>;

  constructor(private readonly config: ConfigService) {}

  setTokenValidator(validator: (token: string | null | undefined) => Promise<{ userId: string } | null>) {
    this.validateAccessToken = validator;
  }

  async afterInit(server: Server) {
    const redisUri = this.config.get('REDIS_URI');

    if (redisUri) {
      const pubClient = new Redis(redisUri);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => this.logger.error(`[Redis Pub] ${err.message}`));
      subClient.on('error', (err) => this.logger.error(`[Redis Sub] ${err.message}`));

      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('[Socket.IO] Redis adapter initialized');
    }

    this.logger.log('[Socket.IO] Server initialized successfully');
  }

  async handleConnection(socket: Socket) {
    try {
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        socket.disconnect();
        return;
      }

      const accessToken = getCookie(cookieHeader, COOKIES.ACCESS_TOKEN);

      if (!this.validateAccessToken) {
        this.logger.warn('[Socket.IO] Token validator not set, rejecting connection');
        socket.disconnect();
        return;
      }

      const token = await this.validateAccessToken(accessToken);

      if (!token) {
        socket.disconnect();
        return;
      }

      socket.data = { userId: token.userId };
    } catch {
      socket.disconnect();
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() roomId: string, @ConnectedSocket() socket: Socket) {
    const { userId } = socket.data;
    const hasAccess = checkAccessToRoom(roomId, { userId });

    if (hasAccess) {
      socket.join(roomId);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() roomId: string, @ConnectedSocket() socket: Socket) {
    socket.leave(roomId);
  }
}
