import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSection } from "@/components/page-header";
import { Stat, Stats } from "@/components/stats";
import { Badge } from "@/components/ui/badge";
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
  monthsBefore,
  REFERENCE_DATE,
  reviewKindLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ResetDemoButton } from "./reset-demo-button";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function OverviewPage() {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const repository = getRepository();

  const [documents, colleagues, reviews] = await Promise.all([
    repository.listItems({ kind: "document" }),
    repository.listColleagues(),
    colleague
      ? repository.listReviewItems({
          assigneeId: colleague.id,
          status: "open",
        })
      : Promise.resolve([]),
  ]);
  const active = new Set(
    colleagues
      .filter((person) => person.status === "active")
      .map((person) => person.id),
  );
  const staleBefore = monthsBefore(REFERENCE_DATE, 12);
  const titles = new Map(documents.map((item) => [item.id, item.title]));

  return (
    <>
      <PageHeader
        eyebrow="SD Worx knowledge"
        title={`Welcome, ${colleague?.name ?? user.name}`}
        description={
          colleague
            ? `${colleague.jobTitle}. Figures as of ${formatDate(REFERENCE_DATE)}.`
            : "This account is not linked to a colleague, so it has no review queue."
        }
      />

      <Stats>
        <Stat label="Documents" value={documents.length} />
        <Stat
          label="Without an active owner"
          value={
            documents.filter(
              (item) => !item.ownerId || !active.has(item.ownerId),
            ).length
          }
        />
        <Stat
          label="Not checked in 12 months"
          value={
            documents.filter(
              (item) => !item.lastCheckedAt || item.lastCheckedAt < staleBefore,
            ).length
          }
        />
      </Stats>

      {colleague ? (
        <PageSection
          title="Assigned to you"
          description={`${reviews.length} open ${reviews.length === 1 ? "item" : "items"}.`}
        >
          {reviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Why</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {reviewKindLabels[review.kind]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {titles.get(review.itemIds[0] ?? "") ?? review.itemIds[0]}
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
      ) : null}

      {user.role === "knowledge_manager" ? (
        <PageSection
          title="Demo data"
          description="Restore the original corpus before a demo run."
        >
          <div>
            <ResetDemoButton />
          </div>
        </PageSection>
      ) : null}
    </>
  );
}
