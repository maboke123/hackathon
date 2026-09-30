"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
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
const failedSignInsPerEmail = createRateLimit("sign-in-email", 5, TEN_MINUTES);
const failedSignInsPerIp = createRateLimit("sign-in-ip", 20, TEN_MINUTES);
const signUpsPerIp = createRateLimit("sign-up-ip", 10, TEN_MINUTES);

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
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

  const { email } = parsed.data;
  const ip = await clientIp();
  if (
    failedSignInsPerEmail.isLimited(email) ||
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
      failedSignInsPerEmail.hit(email);
      failedSignInsPerIp.hit(ip);
      return {
        status: "error",
        message: "Email or password is incorrect.",
        values,
      };
    }
    throw error;
  }

  failedSignInsPerEmail.reset(email);
  redirect("/overview");
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

  redirect("/overview");
}

export async function signInAsDemo(colleagueId: unknown): Promise<void> {
  const id = z.string().parse(colleagueId);
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

  redirect("/overview");
}

export async function signOut(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}
