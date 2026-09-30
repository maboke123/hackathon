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
  await getAuth().api.signUpEmail({
    body: {
      name: colleague.name,
      email: colleague.email,
      password: DEMO_PASSWORD,
    },
  });
}
