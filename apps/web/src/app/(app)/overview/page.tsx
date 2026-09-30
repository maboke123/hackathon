import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSection } from "@/components/page-header";
import { Stat, Stats } from "@/components/stats";
import { TeamSummaryTable } from "@/components/team-summary-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  getRepository,
  type KnowledgeLink,
  REFERENCE_DATE,
  type ReviewItem,
  reviewKindLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { outcomesFor } from "@/lib/review";
import { hasActiveOwner, isChecked, summariseTeams } from "@/lib/trust-summary";

export const metadata: Metadata = {
  title: "Overview",
};

const QUEUE_PREVIEW = 5;
const RECENT_DECISIONS = 5;

function outcomeLabel(review: ReviewItem, links: KnowledgeLink[]): string {
  if (!review.outcome) return "Settled";
  if (review.outcome.startsWith("reassigned")) return "Passed on";
  const link = links.find((entry) => entry.id === review.linkId) ?? null;
  return (
    outcomesFor(review, link).find((option) => option.id === review.outcome)
      ?.label ?? "Settled"
  );
}

export default async function OverviewPage() {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const repository = getRepository();

  const [documents, colleagues, teams, openReviews, doneReviews, links] =
    await Promise.all([
      repository.listItems({ kind: "document" }),
      repository.listColleagues(),
      repository.listTeams(),
      repository.listReviewItems({ status: "open" }),
      repository.listReviewItems({ status: "done" }),
      repository.listLinks(),
    ]);
  const queue =
    user.role === "knowledge_manager"
      ? openReviews
      : colleague
        ? openReviews.filter(
            (review) =>
              review.assigneeId === colleague.id ||
              (!review.assigneeId &&
                review.assigneeTeamId === colleague.teamId),
          )
        : [];
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const titles = new Map(documents.map((item) => [item.id, item.title]));
  const current = documents.filter((item) => item.status !== "retired");
  const summaries = summariseTeams(documents, colleagues, teams, openReviews);
  const recent = [...doneReviews]
    .sort((a, b) => (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? ""))
    .slice(0, RECENT_DECISIONS);
  const conflicts = openReviews.filter((review) => review.kind === "conflict");

  return (
    <>
      <PageHeader
        eyebrow="SD Worx knowledge"
        title="Overview"
        description={
          colleague
            ? `${colleague.jobTitle}. Figures as of ${formatDate(REFERENCE_DATE)}.`
            : "This account is not linked to a colleague, so it has no review queue."
        }
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/ask">Ask a question</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/review">Open review</Link>
          </Button>
        </div>
      </PageHeader>

      <Stats>
        <Stat
          label="Documents in use"
          value={current.length}
          detail={`${documents.length - current.length} retired`}
        />
        <Stat
          label="Without an active owner"
          value={current.filter((item) => !hasActiveOwner(item, people)).length}
        />
        <Stat
          label="Not checked in 12 months"
          value={current.filter((item) => !isChecked(item)).length}
        />
        <Stat
          label="Open conflicts"
          value={conflicts.length}
          detail="Answers name the owner instead of guessing"
        />
      </Stats>

      <PageSection
        title={
          user.role === "knowledge_manager"
            ? "Open in every queue"
            : "Assigned to you"
        }
        description={`${queue.length} open ${queue.length === 1 ? "item" : "items"}. Each one is a single click in the review queue.`}
        action={
          queue.length > 0 ? (
            <Button asChild variant="outline">
              <Link href="/review">Review all</Link>
            </Button>
          ) : null
        }
      >
        {queue.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Why</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.slice(0, QUEUE_PREVIEW).map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <Badge
                      variant={
                        review.kind === "conflict" ? "destructive" : "secondary"
                      }
                    >
                      {reviewKindLabels[review.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/review#${review.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {titles.get(review.itemIds[0] ?? "") ?? review.itemIds[0]}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">
                    {review.trigger}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nothing to review"
            description="Every document you own is checked and has no open conflicts."
          />
        )}
      </PageSection>

      <PageSection
        title="Trust per team"
        description="Measured per team, never per person."
        action={
          <Button asChild variant="outline">
            <Link href="/documents">All documents</Link>
          </Button>
        }
      >
        <TeamSummaryTable summaries={summaries.slice(0, 6)} />
      </PageSection>

      <PageSection
        title="Recent decisions"
        description="The audit trail. Every decision in the review queue is logged with who and when."
      >
        {recent.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {recent.map((review) => (
              <li
                key={review.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/documents/${review.itemIds[0] ?? ""}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {titles.get(review.itemIds[0] ?? "") ?? review.itemIds[0]}
                  </Link>
                  <span className="text-muted-foreground text-sm">
                    {reviewKindLabels[review.kind]}:{" "}
                    {outcomeLabel(review, links)}
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {people.get(review.resolvedBy ?? "")?.name ?? "A colleague"}
                  {review.resolvedAt
                    ? `, ${formatDate(review.resolvedAt.slice(0, 10))}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No decisions yet"
            description="Settle an item in the review queue and it shows up here."
          />
        )}
      </PageSection>
    </>
  );
}
