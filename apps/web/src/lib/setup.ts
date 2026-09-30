import "server-only";
import { sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { ensureDemoUser, getDemoAccounts } from "@/lib/auth/demo-accounts";
import { getRepository } from "@/lib/data";
import { getDb, getDbDriver, migrateDb } from "@/lib/db";
import { embedMissingDocuments } from "@/lib/embeddings";

const CONNECT_ATTEMPTS = 15;
const RETRY_DELAY_MS = 2000;

async function waitForDatabase(): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await getDb().execute(sql`select 1`);
      return;
    } catch (error) {
      if (attempt === CONNECT_ATTEMPTS) {
        throw error;
      }
      console.warn(
        `Database not reachable, retrying (${attempt}/${CONNECT_ATTEMPTS})`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function setup(): Promise<void> {
  // Surfaces auth config errors, like a missing secret, at startup.
  await getAuth().$context;

  if (getDbDriver() === "pglite") {
    console.info(
      "Using an in-memory database. Data resets on restart. Set DATABASE_URL to use Postgres.",
    );
  }

  await waitForDatabase();
  await migrateDb();

  const repository = getRepository();
  if (!(await repository.isSeeded())) {
    await repository.reset();
  }
  for (const { colleague } of await getDemoAccounts()) {
    await ensureDemoUser(colleague);
  }
  embedMissingDocuments().catch((error: unknown) => {
    console.warn("Could not embed documents at startup.", error);
  });
}
