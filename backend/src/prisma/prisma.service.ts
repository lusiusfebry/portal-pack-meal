import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    const url = process.env.DATABASE_URL || '';
    try {
      let info = '';
      try {
        const u = new URL(url);
        const db = (u.pathname || '').replace(/^\//, '');
        info = `[host=${u.hostname}] [port=${u.port || '5432'}] [db=${db}]`;
      } catch {
        info = '[url=parse-failed]';
      }
      // eslint-disable-next-line no-console
      console.log('[Prisma] Connecting...', info);
      await this.$connect();
      // eslint-disable-next-line no-console
      console.log('[Prisma] Connected.');
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[Prisma] Connection failed:', e?.message || e);
      // eslint-disable-next-line no-console
      console.error('[Prisma] Check DATABASE_URL and that PostgreSQL is running & accessible.');
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
