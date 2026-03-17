import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), EventEmitterModule.forRoot()],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
