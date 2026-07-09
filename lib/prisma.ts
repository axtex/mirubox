import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  // Session pooler (5432) is reliable for Prisma; transaction pooler (6543) times out on auth queries.
  //
  // NOT switched to DATABASE_URL (6543, pgbouncer=true&connection_limit=1) despite that param
  // being set for this exact purpose: this client uses the @prisma/adapter-pg driver adapter,
  // whose performIO() only names a prepared statement when pgOptions.statementNameGenerator is
  // configured (see node_modules/@prisma/adapter-pg/dist/index.js) — which we never set, so it
  // already issues unnamed statements today. `pgbouncer=true` is a native-Prisma-engine
  // connection-string convention that `pg`'s own URL parser silently ignores; there's no adapter
  // code path here for it to fix. Flipping to the transaction-mode pooler is therefore unverified
  // to resolve the original timeout and risks reproducing it, and it can't be safely load-tested
  // against production Supabase auth from this environment. Left on DIRECT_URL until someone can
  // verify sign-in against the 6543 pooler in a real environment.
  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
