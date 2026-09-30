import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { getDemoAccounts } from "@/lib/auth/demo-accounts";
import { roleDescriptions, roleLabels } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { initials } from "@/lib/format";
import { signInAsDemo } from "../actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/overview");
  }

  const [company, demoAccounts] = await Promise.all([
    getRepository().getCompany(),
    getDemoAccounts(),
  ]);

  return (
    <>
      <section className="flex max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl leading-[1.1]">Log in</h1>
          <p className="text-muted-foreground">
            Use your work email at {company.name} to see your leave, payslips
            and team.
          </p>
        </div>
        <LoginForm />
        <p className="text-muted-foreground text-sm">
          No account yet?{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl">Demo accounts</h2>
          <p className="text-muted-foreground max-w-md">
            Each account belongs to an employee and sees the app with a
            different role.
          </p>
        </div>
        <ItemGroup className="gap-3">
          {demoAccounts.map(({ role, employee }) => {
            const name = `${employee.firstName} ${employee.lastName}`;
            return (
              <Item key={employee.id} variant="outline">
                <ItemMedia>
                  <Avatar>
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {name}
                    <Badge variant="secondary">{roleLabels[role]}</Badge>
                  </ItemTitle>
                  <ItemDescription>
                    {employee.jobTitle}. {roleDescriptions[role]}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <form action={signInAsDemo.bind(null, employee.id)}>
                    <SubmitButton variant="outline" pendingLabel="Logging in">
                      Log in
                    </SubmitButton>
                  </form>
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </section>
    </>
  );
}
