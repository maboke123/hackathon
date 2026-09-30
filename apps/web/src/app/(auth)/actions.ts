"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth, MAX_PASSWORD_LENGTH } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import {
  DEMO_PASSWORD,
  ensureDemoUser,
  getDemoAccounts,
} from "@/lib/auth/demo-accounts";
import { type FormState, invalidForm } from "@/lib/form-state";
import { clientIp, createRateLimit } from "@/lib/rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;
const TOO_MANY_ATTEMPTS = "Too many attempts. Wait 10 minutes and try again.";

// Calls to Better Auth from server actions skip its built-in rate limiter.
// Keyed on email and address together, so nobody can lock out someone else.
const failedSignInsPerLogin = createRateLimit("sign-in-login", 5, TEN_MINUTES);
const failedSignInsPerIp = createRateLimit("sign-in-ip", 20, TEN_MINUTES);
const signUpsPerIp = createRateLimit("sign-up-ip", 10, TEN_MINUTES);
const demoSignInsPerIp = createRateLimit("demo-sign-in-ip", 60, TEN_MINUTES);

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(MAX_PASSWORD_LENGTH, "Email or password is incorrect."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters.`),
});

export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = signInSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }

  const ip = await clientIp();
  const login = `${parsed.data.email}|${ip}`;
  if (
    failedSignInsPerLogin.isLimited(login) ||
    failedSignInsPerIp.isLimited(ip)
  ) {
    return { status: "error", message: TOO_MANY_ATTEMPTS, values };
  }

  try {
    await getAuth().api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      failedSignInsPerLogin.hit(login);
      failedSignInsPerIp.hit(ip);
      return {
        status: "error",
        message: "Email or password is incorrect.",
        values,
      };
    }
    throw error;
  }

  failedSignInsPerLogin.reset(login);
  redirect("/ask");
}

export async function signUp(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }

  const ip = await clientIp();
  if (signUpsPerIp.isLimited(ip)) {
    return { status: "error", message: TOO_MANY_ATTEMPTS, values };
  }
  signUpsPerIp.hit(ip);

  if (await getRepository().getColleagueByEmail(parsed.data.email)) {
    return {
      status: "error",
      message:
        "This address belongs to a colleague in the demo. Use the demo buttons on the login page, or sign up with another email.",
      values,
    };
  }

  try {
    await getAuth().api.signUpEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      const exists = error.body?.code?.startsWith("USER_ALREADY_EXISTS");
      return {
        status: "error",
        message: exists
          ? "An account with this email already exists. Log in instead."
          : error.message,
        values,
      };
    }
    throw error;
  }

  redirect("/ask");
}

export async function signInAsDemo(colleagueId: unknown): Promise<void> {
  const id = z.string().max(64).parse(colleagueId);
  const ip = await clientIp();
  if (demoSignInsPerIp.isLimited(ip)) {
    throw new Error(TOO_MANY_ATTEMPTS);
  }
  demoSignInsPerIp.hit(ip);

  const account = (await getDemoAccounts()).find(
    (item) => item.colleague.id === id,
  );
  if (!account) {
    throw new Error("Unknown demo account.");
  }

  await ensureDemoUser(account.colleague);
  await getAuth().api.signInEmail({
    body: { email: account.colleague.email, password: DEMO_PASSWORD },
    headers: await headers(),
  });

  redirect("/ask");
}

export async function signOut(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}
