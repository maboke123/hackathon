import "server-only";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

type Connection = {
  db: Database;
  driver: "postgres" | "pglite";
  migrate: () => Promise<void>;
};

const migrationsFolder = path.join(process.cwd(), "drizzle");

function connect(): Connection {
  if (env.DATABASE_URL) {
    const db = drizzlePostgres({
      // Silences the "already exists, skipping" notices the migrator logs on every boot.
      client: postgres(env.DATABASE_URL, { onnotice: () => {} }),
      schema,
      casing: "snake_case",
    });
    return {
      db,
      driver: "postgres",
      migrate: () => migratePostgres(db, { migrationsFolder }),
    };
  }

  const db = drizzlePglite({
    client: new PGlite(),
    schema,
    casing: "snake_case",
  });
  return {
    db,
    driver: "pglite",
    migrate: () => migratePglite(db, { migrationsFolder }),
  };
}

// On globalThis so hot reloads and instrumentation share one connection.
const globalForDb = globalThis as typeof globalThis & {
  __dbConnection?: Connection;
};

function getConnection(): Connection {
  globalForDb.__dbConnection ??= connect();
  return globalForDb.__dbConnection;
}

export function getDb(): Database {
  return getConnection().db;
}

export function getDbDriver(): Connection["driver"] {
  return getConnection().driver;
}

export function migrateDb(): Promise<void> {
  return getConnection().migrate();
}
