import { Injectable } from '@nestjs/common';
import process from 'node:process';
import { z } from 'zod';

const schema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  IS_DEV: z.preprocess(() => process.env.APP_ENV === 'development', z.boolean()),
  PORT: z.coerce.number().optional().default(3001),
  API_URL: z.string(),
  WEB_URL: z.string(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),
  REDIS_URI: z.string().optional(),
  REDIS_ERRORS_POLICY: z.enum(['throw', 'log']).default('log'),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_KEY: z.string().optional(),
  MIXPANEL_API_KEY: z.string().optional(),
  CLOUD_STORAGE_ENDPOINT: z.string().optional(),
  CLOUD_STORAGE_BUCKET: z.string().optional(),
  CLOUD_STORAGE_ACCESS_KEY_ID: z.string().optional(),
  CLOUD_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Config = z.infer<typeof schema>;

@Injectable()
export class ConfigService {
  private readonly config: Config;

  constructor() {
    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
      console.error('❌ Invalid environment variables ❌');
      console.error(z.prettifyError(parsed.error));
      throw new Error('Invalid environment variables');
    }

    this.config = parsed.data;
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  getAll(): Config {
    return this.config;
  }
}
