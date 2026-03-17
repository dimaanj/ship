import { Injectable, Logger } from '@nestjs/common';
import { renderEmailHtml, Template, TemplateProps } from 'mailer';
import { Buffer } from 'node:buffer';
import { Resend } from 'resend';

import { ConfigService } from '../config/config.service';

interface Attachment {
  content?: string | Buffer;
  filename?: string;
  path?: string;
}

interface SendTemplateParams<T extends Template> {
  to: string | string[];
  subject: string;
  template: T;
  params: TemplateProps[T];
  attachments?: Attachment[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend?: Resend;
  private readonly from = { email: 'no-reply@ship.paralect.com', name: 'Ship' };

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('RESEND_API_KEY');
    if (apiKey) this.resend = new Resend(apiKey);
  }

  async sendTemplate<T extends Template>({ to, subject, template, params, attachments }: SendTemplateParams<T>) {
    if (!this.resend) {
      this.logger.error('[Resend] API key is not provided');
      this.logger.debug(`[Resend] Email data: ${JSON.stringify({ subject, template, params })}`);
      return null;
    }

    const html = await renderEmailHtml({ template, params });

    return this.resend.emails
      .send({
        from: `${this.from.name} <${this.from.email}>`,
        to,
        subject,
        html,
        attachments,
      })
      .then(() => {
        this.logger.debug(`[Resend] Sent email to ${to}.`);
        this.logger.debug(`[Resend] ${JSON.stringify({ subject, template, params })}`);
      });
  }
}
