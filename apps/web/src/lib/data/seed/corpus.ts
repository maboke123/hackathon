import { z } from "zod";
import {
  agentQuerySchema,
  type Colleague,
  colleagueSchema,
  customerSchema,
  type KnowledgeItem,
  knowledgeItemSchema,
  type KnowledgeLink,
  newLinkSchema,
  type ReviewItem,
  teamSchema,
} from "../types";
import raw from "./corpus.generated.json";
import { monthsBefore, REFERENCE_DATE } from "./dates";
import { seedLinks } from "./links";

const FALLBACK_TEAM_ID = "team-knowledge-and-content-operations";
const STALE_AFTER_MONTHS = 12;
const SEEDED_AT = `${REFERENCE_DATE}T06:00:00.000Z`;

const corpusSchema = z.object({
  teams: z.array(teamSchema),
  colleagues: z.array(colleagueSchema),
  customers: z.array(customerSchema),
  items: z.array(
    knowledgeItemSchema.extend({
      product: knowledgeItemSchema.shape.product.default(null),
      keywords: knowledgeItemSchema.shape.keywords.default([]),
      usefulness: knowledgeItemSchema.shape.usefulness.default(null),
      usefulnessScoredAt:
        knowledgeItemSchema.shape.usefulnessScoredAt.default(null),
    }),
  ),
  links: z.array(
    newLinkSchema.pick({ fromId: true, toId: true, type: true, reason: true }),
  ),
  agentQueries: z.array(agentQuerySchema),
});

const pad = (value: number) => String(value).padStart(3, "0");

function buildLinks(
  parsed: z.infer<typeof corpusSchema>["links"],
): KnowledgeLink[] {
  const parsedLinks = parsed.map((link) => ({
    ...link,
    evidence: null,
    status: "confirmed" as const,
    origin: "parsed" as const,
    confidence: null,
    createdBy: "system",
  }));
  return [...seedLinks, ...parsedLinks].map((link, index) => ({
    ...link,
    id: `link-${pad(index + 1)}`,
    createdAt: SEEDED_AT,
    resolvedBy: link.status === "confirmed" ? link.createdBy : null,
    resolvedAt: link.status === "confirmed" ? SEEDED_AT : null,
  }));
}

function buildReviewItems(
  items: KnowledgeItem[],
  colleagues: Colleague[],
  links: KnowledgeLink[],
): ReviewItem[] {
  const colleague = (id: string | null) =>
    colleagues.find((person) => person.id === id) ?? null;

  function route(item: KnowledgeItem) {
    const owner = colleague(item.ownerId);
    if (owner?.status === "active") {
      return { assigneeId: owner.id, assigneeTeamId: null };
    }
    const successor = colleague(owner?.successorId ?? null);
    if (successor?.status === "active") {
      return { assigneeId: successor.id, assigneeTeamId: null };
    }
    return {
      assigneeId: null,
      assigneeTeamId: item.teamId ?? FALLBACK_TEAM_ID,
    };
  }

  const reviews: Omit<ReviewItem, "id">[] = [];
  const open = {
    status: "open" as const,
    outcome: null,
    createdAt: SEEDED_AT,
    resolvedBy: null,
    resolvedAt: null,
    payload: null,
  };

  for (const link of links.filter((item) => item.status === "suggested")) {
    const document = items.find((item) => item.id === link.toId);
    if (!document) continue;
    reviews.push({
      ...open,
      kind: link.type === "contradicts" ? "conflict" : "suggested_link",
      itemIds: [link.toId, link.fromId],
      linkId: link.id,
      trigger: link.reason,
      ...route(document),
    });
  }

  const staleBefore = monthsBefore(REFERENCE_DATE, STALE_AFTER_MONTHS);
  for (const item of items) {
    if (item.kind !== "document" || item.status === "retired") continue;
    if (reviews.some((review) => review.itemIds[0] === item.id)) continue;

    const owner = colleague(item.ownerId);
    if (!owner) {
      reviews.push({
        ...open,
        kind: "no_owner",
        itemIds: [item.id],
        linkId: null,
        trigger: "No owner is named in the document.",
        ...route(item),
      });
    } else if (owner.status !== "active") {
      reviews.push({
        ...open,
        kind: "no_owner",
        itemIds: [item.id],
        linkId: null,
        trigger: `Owner ${owner.name} left${owner.endDate ? ` on ${owner.endDate}` : ""}.`,
        ...route(item),
      });
    } else if (!item.lastCheckedAt || item.lastCheckedAt < staleBefore) {
      reviews.push({
        ...open,
        kind: "stale",
        itemIds: [item.id],
        linkId: null,
        trigger: item.lastCheckedAt
          ? `Last checked on ${item.lastCheckedAt}, more than ${STALE_AFTER_MONTHS} months ago.`
          : "No check date in the document.",
        ...route(item),
      });
    }
  }

  return reviews.map((review, index) => ({
    ...review,
    id: `rev-${pad(index + 1)}`,
  }));
}

export function buildCorpusSeed() {
  const corpus = corpusSchema.parse(raw);
  const links = buildLinks(corpus.links);
  return {
    ...corpus,
    links,
    reviewItems: buildReviewItems(corpus.items, corpus.colleagues, links),
  };
}
