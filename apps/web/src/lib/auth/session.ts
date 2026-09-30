import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getRepository } from "@/lib/data";
import { getAuth } from ".";
import type { Role } from "./roles";

export const getSession = cache(async () => {
  // headers() first, so `next build` stops prerendering before auth starts.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
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

export const getCurrentEmployee = cache(async () => {
  const user = await requireUser();
  return user.employeeId ? getRepository().getEmployee(user.employeeId) : null;
});
