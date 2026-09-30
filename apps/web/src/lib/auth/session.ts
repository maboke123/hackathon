import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getRepository } from "@/lib/data";
import { getAuth, roleForColleague } from ".";
import { isDemoColleague } from "./demo-accounts";
import type { Role } from "./roles";

// Role and colleague link are checked against the corpus on every request, so
// a leaver or a team change takes effect without waiting for a new session.
export const getSession = cache(async () => {
  // headers() first, so `next build` stops prerendering before auth starts.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  const { colleagueId, email } = session.user;
  if (!colleagueId) {
    return { ...session, user: { ...session.user, role: "colleague" as Role } };
  }

  const colleague = await getRepository().getColleague(colleagueId);
  if (
    !colleague ||
    colleague.status !== "active" ||
    !isDemoColleague(colleague.id) ||
    colleague.email.toLowerCase() !== email.toLowerCase()
  ) {
    return null;
  }
  return {
    ...session,
    user: { ...session.user, role: roleForColleague(colleague) },
  };
});

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>["user"];

export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    notFound();
  }
  return user;
}

export const getCurrentColleague = cache(async () => {
  const user = await requireUser();
  return user.colleagueId
    ? getRepository().getColleague(user.colleagueId)
    : null;
});
