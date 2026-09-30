import "server-only";
import { getDb } from "@/lib/db";
import { createDbRepository } from "./db-repository";
import type { DataRepository } from "./repository";

const globalStore = globalThis as typeof globalThis & {
  __dataRepository?: DataRepository;
};

export function getRepository(): DataRepository {
  globalStore.__dataRepository ??= createDbRepository(getDb());
  return globalStore.__dataRepository;
}

export { monthsBefore, REFERENCE_DATE } from "./seed/dates";
export * from "./labels";
export type * from "./repository";
export * from "./types";
