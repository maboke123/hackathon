import { createMemoryRepository } from "./memory-repository";
import type { DataRepository } from "./repository";

const globalStore = globalThis as typeof globalThis & {
  __dataRepository?: DataRepository;
};

export function getRepository(): DataRepository {
  globalStore.__dataRepository ??= createMemoryRepository();
  return globalStore.__dataRepository;
}

export { REFERENCE_DATE } from "./seed/dates";
export * from "./labels";
export type * from "./repository";
export * from "./types";
