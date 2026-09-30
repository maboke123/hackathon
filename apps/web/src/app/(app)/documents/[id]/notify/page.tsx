import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { canManageUpload, listAffected } from "@/lib/upload";
import { type AnswerView, type DependentView, NotifyForm } from "./notify-form";

export const metadata: Metadata = {
  title: "Tell who is affected",
};

const titles = (items: { title: string }[]) =>
  items.map((item) => item.title).join(" and ");

export default async function NotifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const { id } = await params;
  const item = await getRepository().getItem(id);
  if (!item || !canManageUpload(item, colleague, user.role)) notFound();

  const affected = await listAffected(item);
  const replaced = affected.replaced.map((entry) => entry.item);

  const answers: AnswerView[] = affected.answers.map((entry) => ({
    id: entry.answer.id,
    customer: entry.customerName,
    recipient: entry.recipient.name,
    meta: `${entry.answer.id}, by ${entry.channel} on ${formatDate(entry.answer.createdAt.slice(0, 10))}`,
    consultant: entry.consultant?.name ?? "a colleague",
    reliedOn: titles(entry.reliedOn),
    told: entry.told,
    oldValues: entry.oldValues,
    draft: entry.draft,
    sentOn: entry.correction
      ? formatDate(entry.correction.createdAt.slice(0, 10))
      : null,
  }));

  const dependents: DependentView[] = affected.dependents.map((entry) => ({
    id: entry.item.id,
    title: entry.item.title,
    owner: entry.owner?.name ?? null,
    queued: entry.openReview,
    meta: [
      `Based on ${entry.parent.title}`,
      entry.owner
        ? `owner ${entry.owner.name}${
            entry.owner.status === "active"
              ? ""
              : entry.successor
                ? ` (left, goes to ${entry.successor.name})`
                : " (left, goes to the team inbox)"
          }`
        : "no owner, name one first",
      entry.item.lastCheckedAt
        ? `checked ${formatDate(entry.item.lastCheckedAt)}`
        : "never checked",
    ].join(", "),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Step 3 of 3"
        title="Tell who relied on the old version"
        description={
          replaced.length > 0
            ? `${item.title} replaces ${titles(replaced)}. Choose who hears about it: everyone, a few or nobody.`
            : undefined
        }
      />
      {replaced.length > 0 ? (
        <NotifyForm
          itemId={item.id}
          answers={answers}
          dependents={dependents}
        />
      ) : (
        <EmptyState
          title="This document does not replace another one"
          description="Only a document that replaces another has customers and owners to tell."
        >
          <Button asChild variant="outline">
            <Link href={`/documents/${item.id}`}>Go to the document</Link>
          </Button>
        </EmptyState>
      )}
    </>
  );
}
