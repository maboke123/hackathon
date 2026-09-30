import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Design system",
};

type Swatch = {
  name: string;
  value: string;
  className: string;
};

const brandSwatches: Swatch[] = [
  { name: "Blue", value: "#006DD8", className: "bg-brand-blue" },
  { name: "Red", value: "#F1002F", className: "bg-brand-red" },
  { name: "Yellow", value: "#FFBE00", className: "bg-brand-yellow" },
  { name: "Navy", value: "#001C52", className: "bg-brand-navy" },
];

const surfaceSwatches: Swatch[] = [
  { name: "Background", value: "background", className: "bg-background" },
  { name: "Muted", value: "muted", className: "bg-muted" },
  { name: "Secondary", value: "secondary", className: "bg-secondary" },
  { name: "Accent", value: "accent", className: "bg-accent" },
  { name: "Primary", value: "primary", className: "bg-primary" },
  { name: "Inverse", value: "inverse", className: "bg-inverse" },
];

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {swatches.map((swatch) => (
        <div key={swatch.name} className="flex flex-col gap-2">
          <div className={`h-20 rounded-lg border ${swatch.className}`} />
          <div>
            <p className="text-sm font-medium">{swatch.name}</p>
            <p className="text-muted-foreground font-mono text-xs">
              {swatch.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t py-10">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="flex flex-col gap-6 pb-10">
        <Logo className="self-start" />
        <h1 className="text-5xl leading-[1.05]">Design system</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          One visual language for the demo app, the slide decks and the promo
          videos. Full guidelines live in packages/design-system/DESIGN.md.
        </p>
      </header>

      <Section title="Brand colours">
        <SwatchGrid swatches={brandSwatches} />
      </Section>

      <Section title="Surfaces">
        <SwatchGrid swatches={surfaceSwatches} />
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <p className="font-heading text-heading text-6xl font-semibold leading-none tracking-tight">
            Display 60
          </p>
          <h1 className="text-4xl">Heading 1, Hanken Grotesk 600</h1>
          <h2 className="text-3xl">Heading 2, Hanken Grotesk 600</h2>
          <h3 className="text-xl">Heading 3, Hanken Grotesk 600</h3>
          <p className="max-w-2xl">
            Body text is set in Inter at 16px with a 1.5 line height. Keep line
            length under 75 characters and let whitespace do the structuring.
          </p>
          <p className="text-muted-foreground text-sm">
            Muted supporting text, 14px.
          </p>
          <p className="font-mono text-sm">Mono 14px: const answer = 42;</p>
        </div>
      </Section>

      <Section title="Logo mark">
        <div className="flex items-center gap-10">
          <LogoMark className="h-16" />
          <div className="bg-inverse flex h-24 flex-1 items-center rounded-lg px-8">
            <LogoMark variant="white" className="h-12" />
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Components">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payroll run</CardTitle>
              <CardDescription>September 2026, 248 employees</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Form field</CardTitle>
              <CardDescription>Labels sit above inputs</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="name@company.com" />
            </CardContent>
          </Card>
        </div>
      </Section>
    </main>
  );
}
