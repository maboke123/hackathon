import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Logo />
        <Button asChild variant="outline">
          <Link href="/design-system">Design system</Link>
        </Button>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 py-24">
        <LogoMark className="h-14" />
        <h1 className="max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
          Hackathon starter, ready for the brief.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Replace this page once the challenge is known. Tokens, components and
          typography are already wired to the shared design system.
        </p>
      </section>
    </main>
  );
}
