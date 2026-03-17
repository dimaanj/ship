import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import durationPlugin from 'dayjs/plugin/duration';
import mongoose from 'mongoose';
import { readdirSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

dayjs.extend(durationPlugin);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  version: number;
  description?: string;
  migrate?: () => Promise<void>;
}

@Injectable()
export class MigratorService {
  private readonly logger = new Logger(MigratorService.name);
  private readonly migrationVersionCollection: mongoose.Collection;
  private readonly migrationLogCollection: mongoose.Collection;
  private readonly migrationPaths: string;
  private readonly versionDocId = 'migration_version';

  constructor(@InjectConnection() private readonly connection: mongoose.Connection) {
    this.migrationVersionCollection = this.connection.collection('__migrationVersion');
    this.migrationLogCollection = this.connection.collection('__migrationLog');
    this.migrationPaths = path.join(__dirname, 'migrations');
  }

  async exec() {
    const [migrations, currentVersion] = await Promise.all([this.getMigrations(), this.getCurrentVersion()]);
    await this.run(migrations, currentVersion);
  }

  private async getCurrentVersion(): Promise<number> {
    const doc = await this.migrationVersionCollection.findOne({ _id: this.versionDocId as any });
    return doc ? (doc.version as number) : 0;
  }

  private getMigrationNames(): string[] {
    return readdirSync(this.migrationPaths).filter((file) => !file.endsWith('.js.map'));
  }

  private async getMigrations(): Promise<Migration[]> {
    const names = this.getMigrationNames();

    return Promise.all(
      names.map(async (name) => {
        const migrationPath = path.join(this.migrationPaths, name);
        const mod = await import(migrationPath);
        return mod.default;
      }),
    );
  }

  private async run(migrations: Migration[], curVersion: number) {
    const newMigrations = migrations
      .filter((m) => m.version > curVersion)
      .sort((a, b) => a.version - b.version);

    if (!newMigrations.length) {
      this.logger.log(`No new migrations found. Current database version is ${curVersion}`);
      return;
    }

    let migrationLogId: string | undefined;
    let currentMigration: Migration | undefined;

    try {
      for (const migration of newMigrations) {
        currentMigration = migration;
        migrationLogId = new mongoose.Types.ObjectId().toHexString();
        const startTime = dayjs();

        await this.startMigrationLog(migrationLogId, startTime.unix(), migration.version);
        this.logger.log(`Migration #${migration.version} is running: ${migration.description}`);

        if (!migration.migrate) {
          throw new Error('migrate function is not defined for the migration');
        }

        await migration.migrate();

        await this.setNewVersion(migration.version);
        const finishTime = dayjs();
        const duration = dayjs.duration(finishTime.diff(startTime)).format('H [hrs], m [min], s [sec], SSS [ms]');

        await this.finishMigrationLog(migrationLogId, finishTime.unix(), duration);
        this.logger.log(`Database updated to version #${migration.version} (${duration})`);
      }

      this.logger.log(`All migrations finished. Current database version: ${newMigrations.at(-1)?.version}`);
    } catch (err) {
      if (currentMigration) {
        this.logger.error(`Failed to update migration to version ${currentMigration.version}`);
        this.logger.error(err);

        if (migrationLogId) {
          await this.failMigrationLog(migrationLogId, Date.now(), err as Error);
        }
      }

      throw err;
    }
  }

  private async setNewVersion(version: number) {
    await this.migrationVersionCollection.updateOne(
      { _id: this.versionDocId as any },
      { $set: { version }, $setOnInsert: { _id: this.versionDocId } as any },
      { upsert: true },
    );
  }

  private async startMigrationLog(id: string, startTime: number, migrationVersion: number) {
    await this.migrationLogCollection.updateOne(
      { _id: id as any },
      {
        $set: { migrationVersion, startTime, status: 'running' },
        $setOnInsert: { _id: id } as any,
      },
      { upsert: true },
    );
  }

  private async finishMigrationLog(id: string, finishTime: number, duration: string) {
    await this.migrationLogCollection.updateOne(
      { _id: id as any },
      { $set: { finishTime, status: 'completed', duration } },
    );
  }

  private async failMigrationLog(id: string, finishTime: number, err: Error) {
    await this.migrationLogCollection.updateOne(
      { _id: id as any },
      { $set: { finishTime, status: 'failed', error: err.message, errorStack: err.stack } },
    );
  }
}
