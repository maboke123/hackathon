import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentBody } from "@/components/document-body";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSection } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  getRepository,
  type KnowledgeItem,
  type KnowledgeLink,
  languageLabels,
  type LinkType,
  linkStatusLabels,
  reviewKindLabels,
  sourceSystemLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { coverage, listDownstream } from "@/lib/changes";
import { canManageUpload } from "@/lib/upload";
import { RecordChangeForm } from "./record-change-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getRepository().getItem(id);
  return { title: item?.title ?? "Document" };
}

const outgoingLabels: Record<LinkType, string> = {
  supersedes: "Replaces",
  contradicts: "Contradicts",
  variant_of: "Variant of",
  duplicate_of: "Copy of",
  supports: "Supports",
  based_on: "Based on",
  answered_with: "Answer relied on",
};

const incomingLabels: Record<LinkType, string> = {
  supersedes: "Replaced by",
  contradicts: "Contradicted by",
  variant_of: "Has variant",
  duplicate_of: "Has copy",
  supports: "Supported by",
  based_on: "Used by",
  answered_with: "Answers that relied on it",
};

function Facts({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LinkRow({
  link,
  other,
  label,
}: {
  link: KnowledgeLink;
  other: KnowledgeItem | undefined;
  label: string;
}) {
  return (
    <li className="grid gap-2 p-4 sm:grid-cols-[12rem_1fr]">
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant={
            link.status === "confirmed"
              ? "secondary"
              : link.status === "suggested"
                ? "outline"
                : "ghost"
          }
        >
          {linkStatusLabels[link.status]}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        {other?.kind === "document" ? (
          <Link
            href={`/documents/${other.id}`}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {other.title}
          </Link>
        ) : (
          <span className="font-medium">{other?.title ?? link.toId}</span>
        )}
        <span className="text-muted-foreground text-sm">{link.reason}</span>
      </div>
    </li>
  );
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const { id } = await params;
  const { published } = await searchParams;
  const repository = getRepository();
  const item = await repository.getItem(id);
  if (!item) notFound();

  const [links, colleagues, teams, customers, reviews, downstream] =
    await Promise.all([
      repository.listLinks({ itemId: item.id }),
      repository.listColleagues(),
      repository.listTeams(),
      repository.listCustomers(),
      repository.listReviewItems({ itemId: item.id, status: "open" }),
      listDownstream(item),
    ]);
  const others = new Map(
    (
      await Promise.all(
        links.map((link) =>
          repository.getItem(link.fromId === item.id ? link.toId : link.fromId),
        ),
      )
    )
      .filter((entry): entry is KnowledgeItem => entry !== null)
      .map((entry) => [entry.id, entry]),
  );
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const owner = item.ownerId ? people.get(item.ownerId) : undefined;
  const modifiedBy = item.modifiedById
    ? people.get(item.modifiedById)
    : undefined;
  const team = teams.find((entry) => entry.id === item.teamId);
  const customer = customers.find((entry) => entry.id === item.customerId);
  const answers = links.filter(
    (link) => link.type === "answered_with" && link.toId === item.id,
  );
  const graphLinks = links.filter((link) => link.type !== "answered_with");
  const covered = coverage(item, downstream);
  const canManage = canManageUpload(item, colleague, user.role);
  const replacesOthers = links.some(
    (link) =>
      link.type === "supersedes" &&
      link.status === "confirmed" &&
      link.fromId === item.id,
  );
  const canRecord =
    item.kind === "document" &&
    item.status !== "retired" &&
    ((colleague !== null && item.ownerId === colleague.id) ||
      user.role === "knowledge_manager");

  return (
    <>
      <PageHeader
        eyebrow={
          item.status === "retired"
            ? "Retired document"
            : `${sourceSystemLabels[item.sourceSystem]} document`
        }
        title={item.title}
        description={item.location}
      >
        {canManage && item.status === "draft" ? (
          <Button asChild>
            <Link href={`/documents/${item.id}/publish`}>
              Check and publish
            </Link>
          </Button>
        ) : canManage && replacesOthers ? (
          <Button asChild variant="outline">
            <Link href={`/documents/${item.id}/notify`}>
              Tell customers and owners
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      {published && item.status === "active" ? (
        <Alert className="mb-10">
          <AlertTitle>Published</AlertTitle>
          <AlertDescription>
            {item.title} is checked today and used in answers from now on. Its
            links are listed below.
          </AlertDescription>
        </Alert>
      ) : null}
      {item.status === "draft" && canManage ? (
        <Alert className="mb-10">
          <AlertTitle>Draft</AlertTitle>
          <AlertDescription>
            Not used in answers yet. Check the labels and conflicts, then
            publish.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl">Trust panel</h2>
          <Facts
            facts={[
              {
                label: "Owner",
                value: owner
                  ? `${owner.name}${owner.status === "active" ? `, ${owner.jobTitle}` : " (left)"}`
                  : "None",
              },
              { label: "Team", value: team?.name ?? "None" },
              {
                label: "Last checked",
                value: item.lastCheckedAt
                  ? formatDate(item.lastCheckedAt)
                  : "Never",
              },
              {
                label: "Next review",
                value: item.nextReviewAt
                  ? formatDate(item.nextReviewAt)
                  : "Not planned",
              },
              {
                label: "Last modified",
                value: `${formatDate(item.modifiedAt.slice(0, 10))}${
                  modifiedBy ? ` by ${modifiedBy.name}` : ""
                }${
                  modifiedBy?.status === "service_account"
                    ? ". A migration, not a check"
                    : ""
                }`,
              },
              {
                label: "Scope",
                value: [
                  item.country ?? "All countries",
                  customer?.name ?? "All customers",
                  item.jointCommittee ? `PC ${item.jointCommittee}` : null,
                ]
                  .filter(Boolean)
                  .join(", "),
              },
              { label: "Language", value: languageLabels[item.language] },
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl">Open reviews</h2>
          {reviews.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        review.kind === "conflict" ? "destructive" : "secondary"
                      }
                    >
                      {reviewKindLabels[review.kind]}
                    </Badge>
                    <Link
                      href={`/review#${review.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Open in review
                    </Link>
                  </div>
                  <span className="text-muted-foreground">
                    {review.trigger}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nothing waiting for the owner.
            </p>
          )}
        </section>
      </div>

      <PageSection
        title="Links"
        description="Why this document is related to others. Only confirmed links change which document answers a question."
      >
        {graphLinks.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {graphLinks.map((link) => {
              const outgoing = link.fromId === item.id;
              return (
                <LinkRow
                  key={link.id}
                  link={link}
                  other={others.get(outgoing ? link.toId : link.fromId)}
                  label={
                    outgoing
                      ? outgoingLabels[link.type]
                      : incomingLabels[link.type]
                  }
                />
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No links yet"
            description="Nothing replaces, contradicts or depends on this document."
          />
        )}
      </PageSection>

      <PageSection
        title="Depends on this document"
        description={
          downstream.length > 0
            ? `${covered.checked} of ${covered.total} checked since this document last changed.`
            : "No other document is based on this one."
        }
      >
        {downstream.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {downstream.map(({ item: child, depth }) => (
              <li
                key={child.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/documents/${child.id}`}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {child.title}
                </Link>
                <span className="text-muted-foreground text-sm">
                  {depth > 1 ? `${depth} levels down, ` : ""}
                  {child.lastCheckedAt
                    ? `checked ${formatDate(child.lastCheckedAt)}`
                    : "never checked"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {canRecord ? (
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">Record a change</h3>
              <p className="text-muted-foreground text-sm">
                The document is marked as checked today. Every document based on
                it goes to its owner with the old value marked. Nothing is
                changed without that owner.
              </p>
            </div>
            <RecordChangeForm itemId={item.id} downstream={downstream.length} />
          </div>
        ) : null}
      </PageSection>

      {answers.length > 0 ? (
        <PageSection
          title="Customers who got an answer from this document"
          description="Living answers. When this document is replaced, these are the customers to tell."
        >
          <ul className="divide-y rounded-lg border">
            {answers.map((link) => {
              const answer = others.get(link.fromId);
              const answerCustomer = customers.find(
                (entry) => entry.id === answer?.customerId,
              );
              return (
                <li key={link.id} className="flex flex-col gap-1 p-4">
                  <span className="font-medium">
                    {answerCustomer?.name ?? "Customer"}:{" "}
                    {answer?.title ?? link.fromId}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {link.fromId}
                    {answer
                      ? `, ${formatDate(answer.createdAt.slice(0, 10))}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </PageSection>
      ) : null}

      <PageSection title="Text">
        <div className="max-h-[40rem] overflow-y-auto rounded-lg border p-6">
          <DocumentBody
            body={item.body}
            passage={null}
            scrollToPassage={false}
          />
        </div>
      </PageSection>
    </>
  );
}
