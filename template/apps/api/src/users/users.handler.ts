import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { SocketEmitterService } from '../socket/socket-emitter.service.js';
import { UsersService } from './users.service.js';
import type { UserDocument } from './users.schema.js';

@Injectable()
export class UsersHandler {
  constructor(
    private usersService: UsersService,
    private analyticsService: AnalyticsService,
    private socketEmitter: SocketEmitterService,
  ) {}

  @OnEvent('users.updated')
  handleUserUpdated(user: UserDocument) {
    try {
      this.socketEmitter.publishToUser(
        user._id.toString(),
        'user:updated',
        this.usersService.getPublic(user),
      );
    } catch (err) {
      console.error('users.updated handler error:', err);
    }
  }

  @OnEvent('users.created')
  handleUserCreated(user: UserDocument) {
    try {
      this.analyticsService.track('New user created', {
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (err) {
      console.error('users.created handler error:', err);
    }
  }
}
