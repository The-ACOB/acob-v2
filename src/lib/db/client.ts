import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  var __acobPrisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

/**
 * A single PrismaClient instance, reused across hot reloads in dev so
 * we don't exhaust connections.
 */
export const db =
  global.__acobPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__acobPrisma = db;
}
