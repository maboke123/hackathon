import "server-only";
import { eq } from "drizzle-orm";
import { type Colleague, getRepository } from "@/lib/data";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getAuth, roleForColleague } from ".";
import type { Role } from "./roles";

// Public on purpose: anyone opening the demo can use these accounts.
export const DEMO_PASSWORD = "havenkaai-demo";

// Add a colleague id here to get another button on the login page.
const DEMO_COLLEAGUE_IDS = ["p-lotte", "p-pieter", "p-elif", "p-ellen"];

export function isDemoColleague(colleagueId: string): boolean {
  return DEMO_COLLEAGUE_IDS.includes(colleagueId);
}

export type DemoAccount = {
  role: Role;
  colleague: Colleague;
};

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const repository = getRepository();
  const accounts: DemoAccount[] = [];
  for (const id of DEMO_COLLEAGUE_IDS) {
    const colleague = await repository.getColleague(id);
    if (colleague) {
      accounts.push({ colleague, role: roleForColleague(colleague) });
    }
  }
  return accounts;
}

export async function ensureDemoUser(colleague: Colleague): Promise<void> {
  const [existing] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, colleague.email));
  if (existing) {
    return;
  }
  // Created directly, because sign-up refuses corpus addresses and cannot
  // set colleagueId.
  const context = await getAuth().$context;
  const user = await context.internalAdapter.createUser(
    {
      name: colleague.name,
      email: colleague.email,
      emailVerified: true,
      colleagueId: colleague.id,
      role: roleForColleague(colleague),
    },
    { method: "admin" },
  );
  if (!user) {
    throw new Error(`Could not create the demo account for ${colleague.id}.`);
  }
  await context.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await context.password.hash(DEMO_PASSWORD),
  });
}
