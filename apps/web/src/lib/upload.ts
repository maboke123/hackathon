import "server-only";
import {
  type Colleague,
  type Customer,
  getRepository,
  itemKindLabels,
  type KnowledgeItem,
  type KnowledgeLink,
  labelItem,
  type Language,
  countryLabels,
} from "@/lib/data";
import { searchTerms } from "@/lib/data/search-terms";
import { type Downstream, listDownstream } from "@/lib/changes";
import { type FactConflict, findConflict } from "@/lib/facts";
import { formatDate } from "@/lib/format";
import { addDays, today } from "@/lib/karma";
import { bestPassage } from "@/lib/passages";
import type { Relation } from "@/lib/relations";
import { enqueueReview } from "@/lib/review";
import { searchDocuments } from "@/lib/search";

export const MAX_UPLOAD_CHARS = 100_000;
const MAX_RELATED = 6;
const MIN_SEARCH_RELEVANCE = 0.6;
const NEXT_REVIEW_DAYS = 365;

const LANGUAGE_WORDS: [Language, string[]][] = [
  ["nl", ["de", "het", "een", "en", "van", "voor", "niet", "zijn", "wordt"]],
  ["fr", ["le", "la", "les", "des", "est", "pour", "une", "du", "dans"]],
  ["de", ["der", "die", "das", "und", "ist", "nicht", "mit", "für", "wird"]],
  ["es", ["el", "los", "las", "del", "para", "por", "una", "con", "es"]],
  ["en", ["the", "and", "of", "for", "is", "with", "to", "are", "not"]],
];

export function detectLanguage(text: string): Language {
  const words = text.toLowerCase().split(/[^\p{L}]+/u);
  const counts = LANGUAGE_WORDS.map(([language, list]) => ({
    language,
    count: words.filter((word) => list.includes(word)).length,
  }));
  return counts.sort((a, b) => b.count - a.count)[0]?.language ?? "en";
}

/** Front matter title, then the first heading, then the file name. */
export function readUpload(raw: string, fileName: string | null) {
  const frontMatter = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const body = (frontMatter ? raw.slice(frontMatter[0].length) : raw).trim();
  const title =
    frontMatter?.[1]?.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1]?.trim() ??
    body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    fileName?.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") ??
    "Untitled document";
  return { title: title.slice(0, 200), body };
}

function detectCustomer(text: string, customers: Customer[]): string | null {
  const lowered = text.toLowerCase();
  return (
    customers.find((customer) => {
      const name = customer.name.split(" ")[0]?.toLowerCase() ?? "";
      return name.length > 3 && lowered.includes(name);
    })?.id ?? null
  );
}

async function nextDocumentId(): Promise<string> {
  const documents = await getRepository().listItems({ kind: "document" });
  const highest = Math.max(
    0,
    ...documents.map((item) => Number(item.id.match(/^doc-(\d+)$/)?.[1] ?? 0)),
  );
  return `doc-${String(highest + 1).padStart(2, "0")}`;
}

async function siteFor(teamId: string): Promise<string> {
  const items = await getRepository().listItems({ teamId });
  const site = items
    .map((item) => item.location.match(/^\/sites\/[^/]+/)?.[0])
    .find(Boolean);
  return site ?? "/sites/Knowledge";
}

/** Stores the upload as a draft with labels suggested from its text. */
export async function createDraft(input: {
  title: string;
  body: string;
  fileName: string | null;
  uploader: Colleague;
}): Promise<KnowledgeItem> {
  const repository = getRepository();
  const [colleagues, customers] = await Promise.all([
    repository.listColleagues(),
    repository.listCustomers(),
  ]);
  const now = new Date().toISOString();
  const fileName = input.fileName ?? `${input.title}.md`;
  const base: KnowledgeItem = {
    id: await nextDocumentId(),
    kind: "document",
    title: input.title,
    body: input.body,
    filePath: `uploads/${fileName}`,
    pdfPath: null,
    sourceSystem: "sharepoint",
    location: `${await siteFor(input.uploader.teamId)}/Shared Documents/${fileName}`,
    language: detectLanguage(input.body),
    country: null,
    customerId: detectCustomer(`${input.title}\n${input.body}`, customers),
    teamId: input.uploader.teamId,
    product: null,
    jointCommittee:
      input.body.match(
        /\b(?:PC|PC\s|paritair comité\s)(\d{3}(?:\.\d{2})?)\b/i,
      )?.[1] ?? null,
    keywords: [],
    ownerId: input.uploader.id,
    authorId: input.uploader.id,
    createdAt: now,
    modifiedAt: now,
    modifiedById: input.uploader.id,
    lastCheckedAt: null,
    nextReviewAt: null,
    status: "draft",
    usefulness: null,
    usefulnessScoredAt: null,
    subject: "",
    documentType: "internal",
    accessLevel: "team",
    accessTeamIds: [],
    labelStatus: "unlabelled",
  };
  const countriesByCustomer = new Map(
    customers.map((customer) => [customer.id, customer.countries]),
  );
  const labels = labelItem(
    { ...base, status: "active" },
    colleagues,
    countriesByCustomer,
  );
  // "partial" until a person saves or publishes the suggested labels.
  return repository.createItem({ ...base, ...labels, labelStatus: "partial" });
}

export function canManageUpload(
  item: KnowledgeItem,
  colleague: Colleague | null,
  role: string,
): boolean {
  return (
    item.kind === "document" &&
    ((colleague !== null &&
      (item.authorId === colleague.id || item.ownerId === colleague.id)) ||
      role === "knowledge_manager")
  );
}

export type RelatedDocument = {
  item: KnowledgeItem;
  owner: Colleague | null;
  conflict: FactConflict | null;
  suggestion: Relation;
  reason: string;
  /** "Ask the owner" needs an owner, a successor or a team to route to. */
  canAskOwner: boolean;
};

function scopeDiffers(a: KnowledgeItem, b: KnowledgeItem): string | null {
  if (a.country && b.country && a.country !== b.country) {
    return `Same topic, applies to ${countryLabels[b.country] ?? b.country}.`;
  }
  if (a.customerId && b.customerId && a.customerId !== b.customerId) {
    return "Same topic, written for another customer.";
  }
  return null;
}

/** Documents on the same subject or with the same terms, with a proposed link. */
export async function findRelated(
  item: KnowledgeItem,
): Promise<RelatedDocument[]> {
  const repository = getRepository();
  const terms = searchTerms(`${item.title} ${item.subject}`).filter(
    (word) => !/^\d+$/.test(word),
  );
  const [documents, hits, colleagues, links] = await Promise.all([
    repository.listItems({ kind: "document" }),
    searchDocuments(`${item.title}\n${item.body.slice(0, 1500)}`, terms),
    repository.listColleagues(),
    repository.listLinks({ status: "confirmed" }),
  ]);
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const relevance = new Map(hits.map((hit) => [hit.item.id, hit.relevance]));
  const candidates = documents
    .filter(
      (other) =>
        other.id !== item.id &&
        other.status !== "retired" &&
        !(other.status === "draft" && other.authorId === item.authorId) &&
        ((item.subject && other.subject === item.subject) ||
          (relevance.get(other.id) ?? 0) >= MIN_SEARCH_RELEVANCE),
    )
    .sort(
      (a, b) =>
        Number(b.subject === item.subject) -
          Number(a.subject === item.subject) ||
        (relevance.get(b.id) ?? 0) - (relevance.get(a.id) ?? 0),
    )
    .slice(0, MAX_RELATED);

  return candidates.map((other): RelatedDocument => {
    const owner = other.ownerId ? (people.get(other.ownerId) ?? null) : null;
    const successor = owner?.successorId
      ? people.get(owner.successorId)
      : undefined;
    const canAskOwner =
      owner !== null &&
      (owner.status === "active" ||
        successor?.status === "active" ||
        Boolean(other.teamId ?? owner.teamId));
    const sameSubject = Boolean(item.subject) && other.subject === item.subject;
    const otherScope = scopeDiffers(item, other);
    const conflict = otherScope
      ? null
      : findConflict(item.body, other.body, sameSubject);
    const base = { item: other, owner, conflict, canAskOwner };

    if (otherScope) {
      return { ...base, suggestion: "variant_of", reason: otherScope };
    }
    const original = links.find(
      (link) => link.type === "duplicate_of" && link.fromId === other.id,
    );
    if (original && !conflict) {
      const title = documents.find(
        (entry) => entry.id === original.toId,
      )?.title;
      return {
        ...base,
        suggestion: "none",
        reason: `Copy of ${title ?? "another document"}. Link to the original instead.`,
      };
    }
    if (conflict) {
      return {
        ...base,
        suggestion: "supersedes",
        reason: `Says ${conflict.theirValue} where your document says ${conflict.myValue}.`,
      };
    }
    if (
      sameSubject &&
      other.documentType === "legal" &&
      item.documentType !== "legal" &&
      other.status === "active"
    ) {
      return {
        ...base,
        suggestion: "based_on",
        reason: `Legal source for ${item.subject.toLowerCase()}${owner ? `, owned by ${owner.name}` : ""}. Same values as your document.`,
      };
    }
    return {
      ...base,
      suggestion: "none",
      reason: sameSubject
        ? `Same topic: ${item.subject.toLowerCase()}. No conflicting values found.`
        : "Uses many of the same terms.",
    };
  });
}

export function allowedRelations(related: RelatedDocument): Relation[] {
  if (related.conflict) {
    return related.canAskOwner
      ? ["supersedes", "variant_of", "contradicts"]
      : ["supersedes", "variant_of"];
  }
  return ["supersedes", "based_on", "variant_of", "none"];
}

export type PublishResult = { superseded: number; askedOwners: string[] };

export async function publishDraft(
  item: KnowledgeItem,
  choices: Map<string, Relation>,
  by: Colleague,
): Promise<PublishResult> {
  const repository = getRepository();
  const result: PublishResult = { superseded: 0, askedOwners: [] };
  const on = today();

  for (const related of await findRelated(item)) {
    const relation = choices.get(related.item.id) ?? related.suggestion;
    if (relation === "none") continue;
    const other = related.item;
    const conflict = related.conflict;
    const reason: Record<Exclude<Relation, "none">, string> = {
      supersedes: conflict
        ? `Says ${conflict.theirValue}. ${item.title} (${formatDate(on)}) says ${conflict.myValue}.`
        : `Replaced by ${item.title} on ${formatDate(on)}.`,
      based_on: `${item.title} applies the rules in this document.`,
      variant_of: "Same topic, different scope.",
      contradicts: conflict
        ? `${item.title} says ${conflict.myValue}, this document says ${conflict.theirValue}. ${by.name} asks the owner which one is right.`
        : `${by.name} thinks ${item.title} disagrees with this document.`,
    };
    const link = await repository.createLink({
      fromId: item.id,
      toId: other.id,
      type: relation,
      reason: reason[relation],
      evidence: conflict?.mine ?? null,
      toEvidence: conflict?.theirs ?? null,
      status: relation === "contradicts" ? "suggested" : "confirmed",
      origin: "person",
      confidence: null,
      createdBy: by.id,
    });
    if (relation === "supersedes") result.superseded += 1;
    if (relation === "contradicts") {
      const queued = await enqueueReview({
        kind: "conflict",
        itemId: other.id,
        relatedItemIds: [item.id],
        linkId: link.id,
        source: "conflict_check",
        trigger: link.reason,
        requestedById: by.id,
      });
      if (queued.status !== "rejected") result.askedOwners.push(other.title);
    }
  }

  await repository.updateItem(item.id, {
    status: "active",
    labelStatus: "labelled",
    lastCheckedAt: on,
    nextReviewAt: addDays(on, NEXT_REVIEW_DAYS),
  });
  return result;
}

export type AffectedAnswer = {
  answer: KnowledgeItem;
  /** The replaced documents this answer relied on. */
  reliedOn: KnowledgeItem[];
  customerName: string;
  recipient: { name: string; email: string | null };
  consultant: Colleague | null;
  channel: string;
  /** What the customer was told. */
  told: string;
  /** The values in what they were told that are no longer right. */
  oldValues: string[];
  draft: string;
  correction: KnowledgeItem | null;
};

export type AffectedDependent = Downstream & {
  parent: KnowledgeItem;
  owner: Colleague | null;
  successor: Colleague | null;
  openReview: boolean;
};

export type Affected = {
  replaced: {
    item: KnowledgeItem;
    link: KnowledgeLink;
    conflict: FactConflict | null;
  }[];
  answers: AffectedAnswer[];
  dependents: AffectedDependent[];
};

export const correctionId = (answerId: string, itemId: string) =>
  `fix-${answerId}-${itemId}`.toLowerCase();

function draftMessage(input: {
  language: Language;
  recipient: string;
  answer: KnowledgeItem;
  item: KnowledgeItem;
  passage: string;
  owner: Colleague | null;
  consultant: Colleague | null;
}): string {
  const firstName = input.recipient.split(" ")[0] ?? input.recipient;
  const date = formatDate(input.answer.createdAt.slice(0, 10));
  const sign = input.consultant?.name ?? "SD Worx customer service";
  if (input.language === "nl") {
    return [
      `Beste ${firstName},`,
      `Op ${date} gaven we u een antwoord over "${input.answer.title}" (${input.answer.id}). Dat antwoord steunde op een document dat intussen vervangen is. Onze excuses daarvoor.`,
      `De juiste informatie: ${input.passage}`,
      `Bron: ${input.item.title}${input.owner ? `, nagekeken door ${input.owner.name}` : ""}.`,
      `Met vriendelijke groeten,\n${sign}`,
    ].join("\n\n");
  }
  return [
    `Dear ${firstName},`,
    `On ${date} we answered your question about "${input.answer.title}" (${input.answer.id}). That answer relied on a document that has since been replaced. We apologise for the confusion.`,
    `The correct information: ${input.passage}`,
    `Source: ${input.item.title}${input.owner ? `, checked by ${input.owner.name}` : ""}.`,
    `Kind regards,\n${sign}`,
  ].join("\n\n");
}

/** Customers who got an answer from a replaced document, and documents built on it. */
export async function listAffected(item: KnowledgeItem): Promise<Affected> {
  const repository = getRepository();
  const [links, colleagues, customers] = await Promise.all([
    repository.listLinks({
      itemId: item.id,
      type: "supersedes",
      status: "confirmed",
    }),
    repository.listColleagues(),
    repository.listCustomers(),
  ]);
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const replaced = (
    await Promise.all(
      links
        .filter((link) => link.fromId === item.id)
        .map(async (link) => {
          const old = await repository.getItem(link.toId);
          return old
            ? {
                item: old,
                link,
                conflict: findConflict(
                  item.body,
                  old.body,
                  old.subject === item.subject,
                ),
              }
            : null;
        }),
    )
  ).filter((entry) => entry !== null);
  const replacedIds = new Set(replaced.map((entry) => entry.item.id));
  const owner = item.ownerId ? (people.get(item.ownerId) ?? null) : null;

  const answers = new Map<string, AffectedAnswer>();
  const dependents: AffectedDependent[] = [];
  for (const { item: old, conflict } of replaced) {
    const answerLinks = await repository.listLinks({
      itemId: old.id,
      type: "answered_with",
      status: "confirmed",
    });
    for (const link of answerLinks.filter((entry) => entry.toId === old.id)) {
      const existing = answers.get(link.fromId);
      if (existing) {
        existing.reliedOn.push(old);
        continue;
      }
      const answer = await repository.getItem(link.fromId);
      if (!answer || answer.id.startsWith("fix-")) continue;
      const customer = customers.find(
        (entry) => entry.id === answer.customerId,
      );
      const contact =
        customer?.contacts.find((entry) => answer.body.includes(entry.name)) ??
        customer?.contacts[0];
      const consultant = answer.authorId
        ? (people.get(answer.authorId) ?? null)
        : null;
      const told =
        answer.body.match(/Resolution:\s*([\s\S]+)$/)?.[1]?.trim() ??
        bestPassage(answer.body, searchTerms(old.title)).text;
      const passage = bestPassage(
        item.body,
        searchTerms(`${answer.title} ${conflict?.myValue ?? ""}`),
      ).text;
      answers.set(answer.id, {
        answer,
        reliedOn: [old],
        customerName: customer?.name ?? "Customer",
        recipient: {
          name: contact?.name ?? customer?.name ?? "Customer",
          email: contact?.email ?? null,
        },
        consultant,
        channel:
          answer.body.match(/Channel:\s*(\w+)/i)?.[1]?.toLowerCase() ??
          itemKindLabels[answer.kind].toLowerCase(),
        told,
        oldValues:
          conflict && told.includes(conflict.theirValue)
            ? [conflict.theirValue]
            : [],
        draft: draftMessage({
          language: answer.language,
          recipient: contact?.name ?? customer?.name ?? "",
          answer,
          item,
          passage,
          owner,
          consultant,
        }),
        correction: await repository.getItem(correctionId(answer.id, item.id)),
      });
    }

    for (const entry of await listDownstream(old)) {
      if (
        entry.item.id === item.id ||
        replacedIds.has(entry.item.id) ||
        dependents.some((dependent) => dependent.item.id === entry.item.id)
      ) {
        continue;
      }
      const reviews = await repository.listReviewItems({
        itemId: entry.item.id,
        kind: "parent_changed",
        status: "open",
      });
      const dependentOwner = entry.item.ownerId
        ? (people.get(entry.item.ownerId) ?? null)
        : null;
      dependents.push({
        ...entry,
        parent: old,
        owner: dependentOwner,
        successor: dependentOwner?.successorId
          ? (people.get(dependentOwner.successorId) ?? null)
          : null,
        openReview: reviews.some((review) => review.itemIds.includes(item.id)),
      });
    }
  }

  return { replaced, answers: [...answers.values()], dependents };
}

export type NotifyResult = {
  sent: number;
  queued: number;
  withoutOwner: string[];
};

export async function notifyAffected(
  item: KnowledgeItem,
  affected: Affected,
  selection: { answers: Map<string, string>; dependentIds: Set<string> },
  by: Colleague,
): Promise<NotifyResult> {
  const repository = getRepository();
  const result: NotifyResult = { sent: 0, queued: 0, withoutOwner: [] };
  const now = new Date().toISOString();

  for (const entry of affected.answers) {
    const message = selection.answers.get(entry.answer.id);
    if (message === undefined || entry.correction) continue;
    const correction = await repository.createItem({
      id: correctionId(entry.answer.id, item.id),
      kind: "answer",
      title: `Correction: ${entry.answer.title}`,
      body: `To: ${entry.recipient.name}${entry.recipient.email ? ` <${entry.recipient.email}>` : ""}\nIn reply to: ${entry.answer.id}\n\n${message}`,
      filePath: "",
      pdfPath: null,
      sourceSystem: "outlook",
      location: `Outlook, sent on behalf of ${entry.consultant?.name ?? by.name}`,
      language: entry.answer.language,
      country: entry.answer.country,
      customerId: entry.answer.customerId,
      teamId: entry.answer.teamId,
      product: null,
      jointCommittee: null,
      keywords: [],
      ownerId: null,
      authorId: entry.consultant?.id ?? by.id,
      createdAt: now,
      modifiedAt: now,
      modifiedById: by.id,
      lastCheckedAt: null,
      nextReviewAt: null,
      status: "active",
      usefulness: null,
      usefulnessScoredAt: null,
      subject: item.subject,
      documentType: "customer_service",
      accessLevel: "team",
      accessTeamIds: entry.answer.teamId ? [entry.answer.teamId] : [],
      labelStatus: "labelled",
    });
    await repository.createLink({
      fromId: correction.id,
      toId: item.id,
      type: "answered_with",
      reason: `Correction of ${entry.answer.id} sent to ${entry.recipient.name} (${entry.customerName}).`,
      evidence: null,
      toEvidence: null,
      status: "confirmed",
      origin: "person",
      confidence: null,
      createdBy: by.id,
    });
    result.sent += 1;
  }

  const on = today();
  for (const dependent of affected.dependents) {
    if (
      !selection.dependentIds.has(dependent.item.id) ||
      dependent.openReview
    ) {
      continue;
    }
    const conflict = affected.replaced.find(
      (entry) => entry.item.id === dependent.parent.id,
    )?.conflict;
    const queued = await enqueueReview({
      kind: "parent_changed",
      itemId: dependent.item.id,
      relatedItemIds: [item.id, dependent.parent.id],
      linkId: dependent.link.id,
      source: "parent_change",
      trigger: `${dependent.parent.title} was replaced by ${item.title} on ${formatDate(on)}. This document is based on it. Check whether it still holds and whether it should follow the new document. Sent by ${by.name}.`,
      requestedById: by.id,
      payload: conflict
        ? {
            field: conflict.theirValue,
            value: conflict.myValue,
            confidence: null,
          }
        : null,
    });
    if (queued.status === "rejected") {
      if (queued.reason === "no_owner") {
        result.withoutOwner.push(dependent.item.title);
      }
    } else {
      result.queued += 1;
    }
  }
  return result;
}
