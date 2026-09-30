import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDemoAccounts } from "@/lib/auth/demo-accounts";
import { getSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage() {
  if (await getSession()) {
    redirect("/overview");
  }

  const [colleagues, demoAccounts] = await Promise.all([
    getRepository().listColleagues(),
    getDemoAccounts(),
  ]);
  const demoEmails = new Set(
    demoAccounts.map((account) => account.colleague.email),
  );
  const examples = colleagues
    .filter(
      (colleague) =>
        colleague.status === "active" && !demoEmails.has(colleague.email),
    )
    .slice(0, 3);

  return (
    <>
      <section className="flex max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl leading-[1.1]">Create account</h1>
          <p className="text-muted-foreground">
            Your account is linked to your colleague record through your work
            email.
          </p>
        </div>
        <SignupForm />
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl">Try a colleague email</h2>
          <p className="text-muted-foreground max-w-md">
            Sign up with the email of any active colleague and you see their
            review queue. Any other email gets an account without a queue.
          </p>
        </div>
        <ul className="divide-y rounded-lg border">
          {examples.map((colleague) => (
            <li key={colleague.id} className="flex flex-col gap-0.5 px-4 py-3">
              <span className="font-mono text-sm">{colleague.email}</span>
              <span className="text-muted-foreground text-sm">
                {colleague.name}, {colleague.jobTitle}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
