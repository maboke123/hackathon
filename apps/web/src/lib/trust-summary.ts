import "server-only";
import {
  type Colleague,
  type KnowledgeItem,
  monthsBefore,
  REFERENCE_DATE,
  type ReviewItem,
  type Team,
} from "@/lib/data";

export type TeamSummary = {
  team: Team;
  documents: number;
  owned: number;
  checked: number;
  conflicts: number;
  open: number;
};

export function isChecked(item: KnowledgeItem): boolean {
  const staleBefore = monthsBefore(REFERENCE_DATE, 12);
  return item.lastCheckedAt !== null && item.lastCheckedAt >= staleBefore;
}

export function hasActiveOwner(
  item: KnowledgeItem,
  colleagues: Map<string, Colleague>,
): boolean {
  return (
    item.ownerId !== null && colleagues.get(item.ownerId)?.status === "active"
  );
}

/** Per team, never per person. */
export function summariseTeams(
  documents: KnowledgeItem[],
  colleagues: Colleague[],
  teams: Team[],
  openReviews: ReviewItem[],
): TeamSummary[] {
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const active = documents.filter((item) => item.status !== "retired");
  return teams
    .map((team) => {
      const own = active.filter((item) => item.teamId === team.id);
      const ids = new Set(own.map((item) => item.id));
      const reviews = openReviews.filter((review) =>
        ids.has(review.itemIds[0] ?? ""),
      );
      return {
        team,
        documents: own.length,
        owned: own.filter((item) => hasActiveOwner(item, people)).length,
        checked: own.filter(isChecked).length,
        conflicts: reviews.filter((review) => review.kind === "conflict")
          .length,
        open: reviews.length,
      };
    })
    .filter((summary) => summary.documents > 0)
    .sort((a, b) => b.open - a.open || b.documents - a.documents);
}

export function share(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}
