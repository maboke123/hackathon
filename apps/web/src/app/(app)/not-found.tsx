import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <PageHeader
      eyebrow="Page not found"
      title="This page does not exist, or your role has no access to it."
    >
      <Button asChild variant="outline">
        <Link href="/overview">Go to overview</Link>
      </Button>
    </PageHeader>
  );
}
