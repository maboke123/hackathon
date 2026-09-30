"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: Route;
  label: string;
  count?: number;
};

export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex h-full items-stretch gap-6 overflow-x-auto">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent text-sm font-medium transition-colors duration-150",
              active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:border-border",
            )}
          >
            {item.label}
            {item.count ? (
              <span className="bg-primary text-primary-foreground rounded px-1.5 text-xs tabular-nums leading-5">
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
