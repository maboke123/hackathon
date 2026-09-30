import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
      <header>
        <Link href="/login" className="inline-block">
          <Logo />
        </Link>
      </header>
      <div className="grid flex-1 content-start gap-16 py-16 lg:grid-cols-2 lg:gap-24 lg:py-24">
        {children}
      </div>
      <footer className="text-muted-foreground border-t pt-6 text-sm">
        Demo for the SD Worx hackathon. People and companies are fictional and
        payroll figures are simulated.
      </footer>
    </main>
  );
}
