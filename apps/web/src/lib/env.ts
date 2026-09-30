import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.url().optional(),
});

// Hosting panels often save unset variables as empty strings.
const definedEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ""),
);

export const env = envSchema.parse(definedEnv);
