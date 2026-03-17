import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Cron(CronExpression.EVERY_MINUTE)
  handleEveryMinute() {
    this.logger.debug('[Scheduler] Emitting cron:every-minute');
    this.eventEmitter.emit('cron:every-minute');
  }

  @Cron(CronExpression.EVERY_HOUR)
  handleEveryHour() {
    this.logger.debug('[Scheduler] Emitting cron:every-hour');
    this.eventEmitter.emit('cron:every-hour');
  }
}
