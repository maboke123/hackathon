import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  type Colleague,
  getRepository,
  type KnowledgeItem,
  type KnowledgeLink,
  type ReviewItem,
  reviewKindLabels,
} from "@/lib/data";
import { toSheetDocument } from "@/lib/document-view";
import { rewardFor, today } from "@/lib/karma";
import { outcomesFor, quickChoices } from "@/lib/review";
import { countryLabels } from "@/lib/data/labels";
import { type SwipeCard, SwipeDeck } from "./swipe-deck";

export const metadata: Metadata = {
  title: "Quick review",
};

type Lookup = {
  viewerId: string;
  colleagues: Map<string, Colleague>;
  customers: Map<string, string>;
};

function rank(review: ReviewItem, viewerId: string) {
  if (review.kind === "suggested_label") {
    if (review.payload?.field === "ownerId") {
      return review.payload.value === viewerId ? 0 : 1;
    }
    return 2;
  }
  return review.kind === "suggested_link" ? 3 : 4;
}

function questionFor(
  review: ReviewItem,
  link: KnowledgeLink | null,
  other: KnowledgeItem | undefined,
  lookup: Lookup,
): string {
  const payload = review.payload;
  if (review.kind === "suggested_label" && payload) {
    switch (payload.field) {
      case "ownerId":
        return payload.value === lookup.viewerId
          ? "Are you the owner of this document?"
          : `Is ${lookup.colleagues.get(payload.value)?.name ?? payload.value} the owner of this document?`;
      case "country":
        return `Does this document apply to ${countryLabels[payload.value] ?? payload.value}?`;
      case "customerId":
        return `Is this document about ${lookup.customers.get(payload.value) ?? payload.value}?`;
      default:
        return `Is the suggested label "${payload.value}" right?`;
    }
  }
  if (review.kind === "suggested_link" && other) {
    if (link?.type === "supersedes") {
      return `Does "${other.title}" replace this document?`;
    }
    if (link?.type === "duplicate_of") {
      return `Is "${other.title}" a copy of this document?`;
    }
    return `Is this document linked to "${other.title}"?`;
  }
  return "Is this document still correct?";
}

export default async function QuickReviewPage() {
  await requireUser();
  const colleague = await getCurrentColleague();

  const back = (
    <Button asChild variant="outline">
      <Link href="/review">
        <ArrowLeftIcon strokeWidth={1.5} data-icon="inline-start" />
        Full queue
      </Link>
    </Button>
  );

  if (!colleague) {
    return (
      <>
        <PageHeader eyebrow="Review" title="Quick review">
          {back}
        </PageHeader>
        <EmptyState
          title="No queue for this account"
          description="This account is not linked to a colleague. Log in with one of the demo accounts to see a queue."
        />
      </>
    );
  }

  const repository = getRepository();
  const [items, links, colleagues, customers, mine] = await Promise.all([
    repository.listItems(),
    repository.listLinks(),
    repository.listColleagues(),
    repository.listCustomers(),
    repository.listReviewItems({ assigneeId: colleague.id, status: "open" }),
  ]);

  const on = today();
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const linkMap = new Map(links.map((link) => [link.id, link]));
  const lookup: Lookup = {
    viewerId: colleague.id,
    colleagues: new Map(colleagues.map((person) => [person.id, person])),
    customers: new Map(
      customers.map((customer) => [customer.id, customer.name]),
    ),
  };

  const swipeable = mine
    .filter((review) => quickChoices[review.kind])
    .sort(
      (a, b) =>
        rank(a, colleague.id) - rank(b, colleague.id) ||
        (b.payload?.confidence ?? 0) - (a.payload?.confidence ?? 0) ||
        a.dueAt.localeCompare(b.dueAt),
    );

  const cards: SwipeCard[] = swipeable.flatMap((review) => {
    const [itemId, otherId] = review.itemIds;
    const item = itemId ? itemMap.get(itemId) : undefined;
    const pair = quickChoices[review.kind];
    if (!item || !pair) return [];
    const link = review.linkId ? (linkMap.get(review.linkId) ?? null) : null;
    const other = otherId ? itemMap.get(otherId) : undefined;
    const outcomes = outcomesFor(review, link);
    const yes = outcomes.find((outcome) => outcome.id === pair[0]);
    const no = outcomes.find((outcome) => outcome.id === pair[1]);
    if (!yes || !no) return [];
    return [
      {
        reviewId: review.id,
        kindLabel: reviewKindLabels[review.kind],
        question: questionFor(review, link, other, lookup),
        reason: review.trigger,
        confidence: review.payload?.confidence ?? null,
        points: rewardFor(review, on).points,
        yes,
        no,
        document: toSheetDocument(item, {
          colleagues: lookup.colleagues,
          customers,
          viewerId: colleague.id,
        }),
      },
    ];
  });

  const needsFullView = mine.length - cards.length;

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="Quick review"
        description="The simple yes or no decisions from your queue, one at a time, starting with ownership. Swipe right or press the right arrow for yes, left for no, down to skip."
      >
        {back}
      </PageHeader>
      <SwipeDeck cards={cards} needsFullView={needsFullView} />
    </>
  );
}
