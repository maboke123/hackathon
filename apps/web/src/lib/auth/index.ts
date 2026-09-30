import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { type Colleague, getRepository } from "@/lib/data";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";
import { type Role, roles } from "./roles";

export const MAX_PASSWORD_LENGTH = 128;

const KNOWLEDGE_TEAM_ID = "team-knowledge-and-content-operations";

export function roleForColleague(colleague: Colleague): Role {
  return colleague.teamId === KNOWLEDGE_TEAM_ID
    ? "knowledge_manager"
    : "colleague";
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
      maxPasswordLength: MAX_PASSWORD_LENGTH,
    },
    // Every auth call goes through a server action with its own checks, so
    // the public endpoints that create or change accounts stay closed.
    disabledPaths: [
      "/sign-up/email",
      "/update-user",
      "/change-password",
      "/set-password",
      "/change-email",
      "/delete-user",
      "/revoke-session",
      "/revoke-sessions",
      "/revoke-other-sessions",
      "/request-password-reset",
      "/reset-password",
    ],
    user: {
      additionalFields: {
        role: {
          type: [...roles],
          required: true,
          defaultValue: "colleague",
          input: false,
        },
        colleagueId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Only ensureDemoUser links a colleague. Sign-up cannot set
          // colleagueId (input: false), and cannot claim a corpus address.
          before: async (user) => {
            if (typeof user.colleagueId === "string") {
              return { data: user };
            }
            if (await getRepository().getColleagueByEmail(user.email)) {
              return false;
            }
            return {
              data: { ...user, role: "colleague", colleagueId: null },
            };
          },
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
