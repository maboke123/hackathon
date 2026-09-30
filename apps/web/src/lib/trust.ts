import "server-only";
import {
  type Colleague,
  type Customer,
  getRepository,
  type KnowledgeItem,
  type KnowledgeLink,
  monthsBefore,
  REFERENCE_DATE,
  type ReviewItem,
  type Team,
} from "@/lib/data";
import { countryLabels } from "@/lib/data/labels";
import { searchTerms } from "@/lib/data/search-terms";
import { formatDate } from "@/lib/format";
import { bestPassage, locatePassage, type Passage } from "@/lib/passages";
import { searchDocuments } from "@/lib/search";

const STALE_AFTER_MONTHS = 12;
const MAX_CANDIDATES = 8;
const RELATED_LINK_TYPES = new Set([
  "supersedes",
  "duplicate_of",
  "variant_of",
]);

const countryNames = countryLabels;

export type Tone = "good" | "warning" | "blocked";

export type Reason = { tone: Tone; text: string };

export type Contact =
  | { kind: "colleague"; colleague: Colleague; note: string | null }
  | { kind: "team"; team: Team };

export type Support = { record: KnowledgeItem; reason: string };

export type Conflict = {
  link: KnowledgeLink;
  other: KnowledgeItem;
  otherPassage: Passage;
  otherSupports: Support[];
  review: ReviewItem | null;
  reviewer: Contact | null;
};

export type Evaluation = {
  item: KnowledgeItem;
  owner: Colleague | null;
  contact: Contact | null;
  passage: Passage;
  /** Short label for why it is not used, null when it can be used. */
  exclusion: string | null;
  reasons: Reason[];
  supports: Support[];
  conflict: Conflict | null;
  score: number;
};

export type AskResult = {
  terms: string[];
  answer: Evaluation | null;
  blocked: Evaluation | null;
  alsoFound: Evaluation[];
  notUsed: Evaluation[];
};

function monthsSince(isoDate: string): number {
  const [year, month] = isoDate.split("-").map(Number);
  const [refYear, refMonth] = REFERENCE_DATE.split("-").map(Number);
  return (
    (refYear ?? 0) * 12 + (refMonth ?? 0) - ((year ?? 0) * 12 + (month ?? 0))
  );
}

type Context = {
  customer: Customer;
  terms: string[];
  colleagues: Map<string, Colleague>;
  teams: Map<string, Team>;
  items: Map<string, KnowledgeItem>;
  openReviews: ReviewItem[];
};

function contactFor(item: KnowledgeItem, context: Context): Contact | null {
  const owner = item.ownerId ? context.colleagues.get(item.ownerId) : undefined;
  if (owner?.status === "active") {
    return { kind: "colleague", colleague: owner, note: null };
  }
  const successor = owner?.successorId
    ? context.colleagues.get(owner.successorId)
    : undefined;
  if (owner && successor?.status === "active") {
    return {
      kind: "colleague",
      colleague: successor,
      note: `Took over from ${owner.name}`,
    };
  }
  const team = item.teamId ? context.teams.get(item.teamId) : undefined;
  return team ? { kind: "team", team } : null;
}

export function contactName(contact: Contact | null): string {
  if (!contact) return "the knowledge team";
  return contact.kind === "colleague"
    ? contact.colleague.name
    : contact.team.name;
}

function supportsFor(
  itemId: string,
  links: KnowledgeLink[],
  context: Context,
): Support[] {
  return links
    .filter(
      (link) =>
        link.type === "supports" &&
        link.status === "confirmed" &&
        link.toId === itemId,
    )
    .flatMap((link) => {
      const record = context.items.get(link.fromId);
      return record ? [{ record, reason: link.reason }] : [];
    });
}

async function loadItem(id: string, context: Context) {
  const cached = context.items.get(id);
  if (cached) return cached;
  const item = await getRepository().getItem(id);
  if (item) context.items.set(id, item);
  return item;
}

async function evaluate(
  item: KnowledgeItem,
  relevance: number,
  context: Context,
): Promise<Evaluation> {
  const repository = getRepository();
  const links = await repository.listLinks({ itemId: item.id });
  await Promise.all(
    links.flatMap((link) => [
      loadItem(link.fromId, context),
      loadItem(link.toId, context),
    ]),
  );
  const title = (id: string) => context.items.get(id)?.title ?? id;
  const owner = item.ownerId
    ? (context.colleagues.get(item.ownerId) ?? null)
    : null;
  const reasons: Reason[] = [];
  let exclusion: string | null = null;
  let score = 100 + 60 * relevance;

  const { customer } = context;
  if (item.customerId && item.customerId !== customer.id) {
    exclusion = "Other customer";
    reasons.push({
      tone: "blocked",
      text: `Written for another customer. The caller is ${customer.name}.`,
    });
  } else if (item.country && !customer.countries.includes(item.country)) {
    exclusion = "Other country";
    reasons.push({
      tone: "blocked",
      text: `Applies to ${countryNames[item.country] ?? item.country}. ${customer.name} is served in ${customer.countries.map((code) => countryNames[code] ?? code).join(", ")}.`,
    });
  }

  if (item.status === "retired") {
    exclusion ??= "Retired";
    reasons.push({ tone: "blocked", text: "Retired by its owner." });
  }

  for (const link of links.filter((entry) => entry.status === "confirmed")) {
    if (link.type === "supersedes" && link.toId === item.id) {
      exclusion ??= "Replaced";
      reasons.push({
        tone: "blocked",
        text: `Replaced by ${title(link.fromId)}. ${link.reason}`,
      });
    }
    if (link.type === "duplicate_of" && link.fromId === item.id) {
      exclusion ??= "Copy";
      reasons.push({
        tone: "blocked",
        text: `Copy of ${title(link.toId)}. ${link.reason}`,
      });
    }
  }

  for (const link of links.filter((entry) => entry.status === "suggested")) {
    if (link.type === "supersedes" && link.toId === item.id) {
      score -= 20;
      reasons.push({
        tone: "warning",
        text: `Possibly replaced by ${title(link.fromId)}. Waiting for the owner to confirm.`,
      });
    }
  }

  if (!owner) {
    score -= 30;
    reasons.push({
      tone: "warning",
      text: "No owner. Nobody vouches for this document.",
    });
  } else if (owner.status !== "active") {
    score -= 25;
    reasons.push({
      tone: "warning",
      text: `Owner ${owner.name} left${owner.endDate ? ` in ${owner.endDate.slice(0, 4)}` : ""}.`,
    });
  } else {
    reasons.push({
      tone: "good",
      text: `Owned by ${owner.name}, ${owner.jobTitle}.`,
    });
  }

  const staleBefore = monthsBefore(REFERENCE_DATE, STALE_AFTER_MONTHS);
  if (!item.lastCheckedAt) {
    score -= 20;
    reasons.push({
      tone: "warning",
      text: "Never checked. Modified dates do not count.",
    });
  } else if (item.lastCheckedAt < staleBefore) {
    score -= 20;
    reasons.push({
      tone: "warning",
      text: `Last checked ${monthsSince(item.lastCheckedAt)} months ago.`,
    });
  } else {
    reasons.push({
      tone: "good",
      text: `Checked on ${formatDate(item.lastCheckedAt)}.`,
    });
  }

  for (const link of links) {
    if (
      link.type !== "based_on" ||
      link.status !== "confirmed" ||
      link.fromId !== item.id
    ) {
      continue;
    }
    const parent = context.items.get(link.toId);
    if (
      parent?.lastCheckedAt &&
      (!item.lastCheckedAt || item.lastCheckedAt < parent.lastCheckedAt)
    ) {
      score -= 25;
      reasons.push({
        tone: "warning",
        text: `The rule it is based on (${parent.title}) changed on ${formatDate(parent.lastCheckedAt)}. Not checked since.`,
      });
    }
  }

  if (item.status === "draft") {
    score -= 40;
    reasons.push({
      tone: "warning",
      text: "Draft. Not approved for customers.",
    });
  }

  const supports = supportsFor(item.id, links, context);
  if (supports.length > 0) {
    score += 10 * Math.min(supports.length, 2);
    reasons.push({
      tone: "good",
      text: `Confirmed in ${supports.length} ${supports.length === 1 ? "record" : "records"}.`,
    });
  }

  let conflict: Conflict | null = null;
  const contradiction = links.find(
    (link) => link.type === "contradicts" && link.status !== "rejected",
  );
  if (contradiction && !exclusion) {
    const otherId =
      contradiction.fromId === item.id
        ? contradiction.toId
        : contradiction.fromId;
    const other = context.items.get(otherId);
    if (other) {
      const otherLinks = await repository.listLinks({ itemId: other.id });
      await Promise.all(
        otherLinks.map((link) => loadItem(link.fromId, context)),
      );
      const review =
        context.openReviews.find(
          (entry) => entry.linkId === contradiction.id,
        ) ?? null;
      const assignee = review?.assigneeId
        ? context.colleagues.get(review.assigneeId)
        : undefined;
      conflict = {
        link: contradiction,
        other,
        otherPassage: contradiction.evidence
          ? locatePassage(other.body, contradiction.evidence)
          : bestPassage(other.body, context.terms),
        otherSupports: supportsFor(other.id, otherLinks, context),
        review,
        reviewer: assignee
          ? { kind: "colleague", colleague: assignee, note: null }
          : contactFor(item, context),
      };
      reasons.push({
        tone: "blocked",
        text: `${other.title} disagrees. ${contradiction.reason}`,
      });
    }
  }

  return {
    item,
    owner,
    contact: contactFor(item, context),
    passage: bestPassage(item.body, context.terms),
    exclusion,
    reasons,
    supports,
    conflict,
    score,
  };
}

function specificity(item: KnowledgeItem): number {
  if (item.customerId) return 2;
  return item.country ? 1 : 0;
}

export async function askQuestion(
  question: string,
  customer: Customer,
): Promise<AskResult> {
  const repository = getRepository();
  // The customer already sets the scope, so its name would only add noise.
  const customerWords = new Set(searchTerms(customer.name));
  const terms = searchTerms(question).filter(
    (term) => !customerWords.has(term),
  );
  const [hits, colleagues, teams, openReviews] = await Promise.all([
    searchDocuments(question, terms),
    repository.listColleagues(),
    repository.listTeams(),
    repository.listReviewItems({ status: "open" }),
  ]);
  const candidates = hits.slice(0, MAX_CANDIDATES);

  // Older versions, copies and variants of a candidate are part of the answer
  // even when the search ranks them low.
  const related = await Promise.all(
    candidates.map((hit) =>
      repository.listLinks({ itemId: hit.item.id, status: "confirmed" }),
    ),
  );
  const relatedIds = new Set(
    related
      .flat()
      .filter((link) => RELATED_LINK_TYPES.has(link.type))
      .flatMap((link) => [link.fromId, link.toId]),
  );
  for (const id of relatedIds) {
    if (candidates.some((hit) => hit.item.id === id)) continue;
    const hit = hits.find((entry) => entry.item.id === id);
    const item = hit?.item ?? (await repository.getItem(id));
    if (item?.kind === "document") {
      candidates.push(hit ?? { item, relevance: 0, matchedBy: "keyword" });
    }
  }

  const context: Context = {
    customer,
    terms,
    colleagues: new Map(
      colleagues.map((colleague) => [colleague.id, colleague]),
    ),
    teams: new Map(teams.map((team) => [team.id, team])),
    items: new Map(candidates.map((hit) => [hit.item.id, hit.item])),
    openReviews,
  };

  const evaluations = await Promise.all(
    candidates.map(async (hit) => {
      const evaluation = await evaluate(hit.item, hit.relevance, context);
      if (hit.matchedBy === "meaning") {
        evaluation.reasons.push({
          tone: "good",
          text: "Found by meaning. The question uses other words than the document.",
        });
      }
      return evaluation;
    }),
  );

  const usable = evaluations
    .filter((evaluation) => !evaluation.exclusion)
    .sort(
      (a, b) =>
        b.score - a.score ||
        specificity(b.item) - specificity(a.item) ||
        (b.item.lastCheckedAt ?? "").localeCompare(a.item.lastCheckedAt ?? ""),
    );
  const [best, ...rest] = usable;

  return {
    terms,
    answer: best && !best.conflict ? best : null,
    blocked: best?.conflict ? best : null,
    alsoFound: rest,
    notUsed: evaluations.filter((evaluation) => evaluation.exclusion),
  };
}
