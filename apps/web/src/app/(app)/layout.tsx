import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { type Role, roleLabels } from "@/lib/auth/roles";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { MainNav, type NavItem } from "./main-nav";
import { UserMenu } from "./user-menu";

const navItems: (NavItem & { roles?: Role[] })[] = [
  { href: "/ask", label: "Ask" },
  { href: "/overview", label: "Overview" },
  { href: "/review", label: "Review" },
  { href: "/documents", label: "Documents" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const openReviews = colleague
    ? await getRepository().listReviewItems({
        assigneeId: colleague.id,
        status: "open",
      })
    : [];
  const items = navItems
    .filter((item) => !item.roles || item.roles.includes(user.role))
    .map(({ href, label }) => ({
      href,
      label,
      count: href === "/review" ? openReviews.length : undefined,
    }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-6">
          <Link href="/ask" className="shrink-0">
            <Logo className="h-7" />
          </Link>
          <MainNav items={items} />
          <div className="ml-auto">
            <UserMenu
              name={user.name}
              email={user.email}
              roleLabel={roleLabels[user.role]}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
