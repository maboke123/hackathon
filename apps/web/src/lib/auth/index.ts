import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { type Employee, getRepository } from "@/lib/data";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";
import { type Role, roles } from "./roles";

const HR_DEPARTMENT_ID = "dep-hr";

export async function roleForEmployee(employee: Employee): Promise<Role> {
  if (employee.departmentId === HR_DEPARTMENT_ID) {
    return "hr";
  }
  const reports = await getRepository().listEmployees({
    managerId: employee.id,
  });
  return reports.length > 0 ? "manager" : "employee";
}

async function linkEmployee(
  email: string,
): Promise<{ employeeId: string | null; role: Role }> {
  const employee = await getRepository().getEmployeeByEmail(email);
  if (!employee || employee.status === "left") {
    return { employeeId: null, role: "employee" };
  }
  return { employeeId: employee.id, role: await roleForEmployee(employee) };
}

function createAuth() {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: env.BETTER_AUTH_SECRET ?? "dev-secret",
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: [...roles],
          required: true,
          defaultValue: "employee",
          input: false,
        },
        employeeId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, ...(await linkEmployee(user.email)) },
          }),
        },
      },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as typeof globalThis & { __auth?: Auth };

// Lazy, so `next build` can import this file without a secret or database.
export function getAuth(): Auth {
  globalForAuth.__auth ??= createAuth();
  return globalForAuth.__auth;
}
