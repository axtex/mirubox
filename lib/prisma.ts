import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  // Production (Vercel serverless): use Supabase transaction pooler (DATABASE_URL, port 6543).
  // Session pooler (DIRECT_URL, port 5432) caps at ~15 concurrent clients and 500s under load.
  // Dev/migrations: prefer DIRECT_URL for stable long-lived connections.
  const connectionString =
    process.env.NODE_ENV === "production"
      ? (process.env.DATABASE_URL ?? process.env.DIRECT_URL!)
      : (process.env.DIRECT_URL ?? process.env.DATABASE_URL!);
  const adapter = new PrismaPg({
    connectionString,
    // One connection per serverless instance — pooler multiplexes across lambdas.
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 20_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse the same client across hot reloads (dev) and warm serverless invocations (prod).
globalForPrisma.prisma = prisma;
