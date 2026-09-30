import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PageSection } from "@/components/page-header";
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
import { requireUser } from "@/lib/auth/session";
import { getRepository, reviewKindLabels } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { hasActiveOwner, isChecked, summariseTeams } from "@/lib/trust-summary";

export const metadata: Metadata = {
  title: "Documents",
};

export default async function DocumentsPage() {
  await requireUser();
  const repository = getRepository();
  const [documents, colleagues, teams, openReviews] = await Promise.all([
    repository.listItems({ kind: "document" }),
    repository.listColleagues(),
    repository.listTeams(),
    repository.listReviewItems({ status: "open" }),
  ]);
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const summaries = summariseTeams(documents, colleagues, teams, openReviews);
  const sorted = [...documents].sort(
    (a, b) =>
      Number(a.status === "retired") - Number(b.status === "retired") ||
      a.title.localeCompare(b.title),
  );

  return (
    <>
      <PageHeader
        eyebrow="Trust graph"
        title="Documents"
        description="Every document with its owner and last check. Open one to see its links, who relies on it and what depends on it."
      >
        <Button asChild>
          <Link href="/documents/new">Add a document</Link>
        </Button>
      </PageHeader>

      <PageSection
        title="Trust per team"
        description="Shares of documents with an active owner and a check in the last 12 months. Measured per team, never per person."
      >
        <TeamSummaryTable summaries={summaries} />
      </PageSection>

      <PageSection
        title="All documents"
        description={`${documents.length} documents from SharePoint, OneDrive and the wiki.`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Last checked</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => {
              const owner = item.ownerId ? people.get(item.ownerId) : null;
              const reviews = openReviews.filter(
                (review) => review.itemIds[0] === item.id,
              );
              return (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/documents/${item.id}`}
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">
                    {item.teamId ? (teamNames.get(item.teamId) ?? "") : ""}
                  </TableCell>
                  <TableCell>
                    {owner ? (
                      hasActiveOwner(item, people) ? (
                        owner.name
                      ) : (
                        <span className="text-muted-foreground">
                          {owner.name} (left)
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      isChecked(item) ? undefined : "text-muted-foreground"
                    }
                  >
                    {item.lastCheckedAt
                      ? formatDate(item.lastCheckedAt)
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.status === "retired" ? (
                        <Badge variant="outline">Retired</Badge>
                      ) : item.status === "draft" ? (
                        <Badge variant="outline">Draft</Badge>
                      ) : reviews.length === 0 ? (
                        <Badge variant="secondary">Up to date</Badge>
                      ) : (
                        [...new Set(reviews.map((review) => review.kind))].map(
                          (kind) => (
                            <Badge
                              key={kind}
                              variant={
                                kind === "conflict" ? "destructive" : "outline"
                              }
                            >
                              {reviewKindLabels[kind]}
                            </Badge>
                          ),
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </PageSection>
    </>
  );
}
