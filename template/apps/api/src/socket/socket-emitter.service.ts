import { Injectable } from '@nestjs/common';

import { SocketGateway } from './socket.gateway.js';

@Injectable()
export class SocketEmitterService {
  constructor(private socketGateway: SocketGateway) {}

  publish(roomId: string | string[], eventName: string, data: unknown): void {
    const server = this.socketGateway.server;
    if (!server) {
      console.error('[Socket.IO] Server is not initialized.');
      return;
    }

    server.to(roomId).emit(eventName, data);
  }

  publishToUser(userId: string, eventName: string, data: unknown): void {
    this.publish(`user-${userId}`, eventName, data);
  }
}
