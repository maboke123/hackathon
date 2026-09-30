import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
      <Logo className="self-start" />
      <div className="flex flex-col gap-4 py-24">
        <p className="text-primary text-sm font-medium uppercase tracking-[0.08em]">
          Page not found
        </p>
        <h1 className="text-4xl leading-[1.1]">
          This page does not exist, or your role has no access to it.
        </h1>
        <Button asChild className="mt-4 self-start">
          <Link href="/overview">Go to overview</Link>
        </Button>
      </div>
    </main>
  );
}
