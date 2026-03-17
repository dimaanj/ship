import { Injectable, Logger } from '@nestjs/common';
import Mixpanel from 'mixpanel';

import { ConfigService } from '../config/config.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private mixpanel: Mixpanel.Mixpanel | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('MIXPANEL_API_KEY');

    if (apiKey) {
      this.mixpanel = Mixpanel.init(apiKey, { debug: this.config.get('IS_DEV') });
    }
  }

  track(event: string, data: Record<string, unknown> = {}) {
    if (!this.mixpanel) {
      this.logger.error('[Mixpanel] The analytics service was not initialized');
      return;
    }

    try {
      this.mixpanel.track(event, data);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
