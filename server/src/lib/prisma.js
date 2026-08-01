import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { config } from '../config/env.js';

let prismaInstance;

if (config.DATABASE_URL.startsWith('postgresql://') || config.DATABASE_URL.startsWith('postgres://')) {
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({
    url: config.DATABASE_URL
  });
  prismaInstance = new PrismaClient({ adapter });
}

export const prisma = prismaInstance;
export default prisma;
