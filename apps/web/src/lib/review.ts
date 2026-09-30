import "server-only";
import {
  type Colleague,
  getRepository,
  type KnowledgeItem,
  type KnowledgeLink,
  monthsBefore,
  type ReviewItem,
  type ReviewKind,
  type ReviewPayload,
  type ReviewSource,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { addDays, dueDays, type Reward, rewardFor, today } from "@/lib/karma";

const REVIEW_EVERY_MONTHS = 12;
const DUE_SOON_DAYS = 14;
/** A document used in an answer should have been checked in the last three months. */
const USED_CHECK_WITHIN_DAYS = 90;

export type EnqueueInput = {
  kind: ReviewKind;
  /** The document the owner has to act on. */
  itemId: string;
  /** Other items the owner needs to see, such as the other side of a conflict. */
  relatedItemIds?: string[];
  linkId?: string | null;
  source: ReviewSource;
  /** Why it is in the queue, in one sentence the owner reads first. */
  trigger: string;
  requestedById?: string | null;
  payload?: ReviewPayload | null;
  dueAt?: string;
};

export type EnqueueResult =
  | { status: "queued"; review: ReviewItem }
  | { status: "already_queued"; review: ReviewItem }
  | {
      status: "rejected";
      reason: "not_found" | "not_a_document" | "retired" | "no_owner";
      message: string;
    };

type Assignee = { assigneeId: string | null; assigneeTeamId: string | null };

async function routeToOwner(item: KnowledgeItem): Promise<Assignee | null> {
  if (!item.ownerId) return null;
  const repository = getRepository();
  const owner = await repository.getColleague(item.ownerId);
  if (owner?.status === "active") {
    return { assigneeId: owner.id, assigneeTeamId: null };
  }
  const successor = owner?.successorId
    ? await repository.getColleague(owner.successorId)
    : null;
  if (successor?.status === "active") {
    return { assigneeId: successor.id, assigneeTeamId: null };
  }
  const teamId = item.teamId ?? owner?.teamId ?? null;
  return teamId ? { assigneeId: null, assigneeTeamId: teamId } : null;
}

/**
 * Puts a task in the queue of the person who owns the document.
 *
 * Preconditions, checked here and rejected when not met:
 * - the item exists, is a document and is not retired;
 * - the document has an owner (`ownerId`). Finding an owner is the labelling
 *   module's job: the queue never guesses one. An owner who left is replaced by
 *   their successor, and without a successor the task goes to the team inbox.
 *
 * Only one open task per document and kind: a second request tightens the
 * deadline of the open one instead of adding a duplicate.
 */
export async function enqueueReview(
  input: EnqueueInput,
): Promise<EnqueueResult> {
  const repository = getRepository();
  const item = await repository.getItem(input.itemId);
  if (!item) {
    return {
      status: "rejected",
      reason: "not_found",
      message: "This document does not exist.",
    };
  }
  if (item.kind !== "document") {
    return {
      status: "rejected",
      reason: "not_a_document",
      message: "Only documents have an owner who can review them.",
    };
  }
  if (item.status === "retired") {
    return {
      status: "rejected",
      reason: "retired",
      message: `${item.title} is retired.`,
    };
  }
  const assignee = await routeToOwner(item);
  if (!assignee) {
    return {
      status: "rejected",
      reason: "no_owner",
      message: `${item.title} has no owner yet.`,
    };
  }

  const dueAt = input.dueAt ?? addDays(today(), dueDays[input.source]);
  const [existing] = (
    await repository.listReviewItems({ itemId: item.id, status: "open" })
  ).filter(
    (review) =>
      review.itemIds[0] === item.id &&
      review.kind === input.kind &&
      (input.linkId == null || review.linkId === input.linkId),
  );
  if (existing) {
    const review =
      dueAt < existing.dueAt
        ? await repository.updateReviewItem(existing.id, {
            dueAt,
            source: input.source,
            trigger: input.trigger,
            requestedById: input.requestedById ?? null,
          })
        : existing;
    return { status: "already_queued", review: review ?? existing };
  }

  const review = await repository.createReviewItem({
    kind: input.kind,
    itemIds: [item.id, ...(input.relatedItemIds ?? [])],
    linkId: input.linkId ?? null,
    trigger: input.trigger,
    payload: input.payload ?? null,
    source: input.source,
    requestedById: input.requestedById ?? null,
    dueAt,
    ...assignee,
  });
  return { status: "queued", review };
}

/**
 * Call when a document was shown or used in an answer. If it was not checked
 * recently, the use becomes the reason to review it, with a short deadline.
 */
export async function reportDocumentUsed(
  itemId: string,
  usage: { description: string; usedById?: string | null },
): Promise<EnqueueResult | null> {
  const item = await getRepository().getItem(itemId);
  if (!item) return null;
  const checkBefore = addDays(today(), -USED_CHECK_WITHIN_DAYS);
  if (item.lastCheckedAt && item.lastCheckedAt >= checkBefore) return null;
  return enqueueReview({
    kind: "stale",
    itemId,
    source: "usage",
    requestedById: usage.usedById ?? null,
    trigger: `${usage.description}. ${
      item.lastCheckedAt
        ? `Last checked on ${formatDate(item.lastCheckedAt)}.`
        : "Never checked."
    }`,
  });
}

function nextReviewDate(item: KnowledgeItem): string | null {
  if (item.nextReviewAt) return item.nextReviewAt;
  return item.lastCheckedAt
    ? monthsBefore(item.lastCheckedAt, -REVIEW_EVERY_MONTHS)
    : null;
}

export type PeriodicCheckResult = {
  queued: number;
  alreadyQueued: number;
  skipped: { itemId: string; message: string }[];
};

/**
 * The nightly check: review dates that are due within two weeks, documents
 * used in answers since their last check, and conflicts nobody picked up yet.
 */
export async function runPeriodicCheck(
  on: string = today(),
): Promise<PeriodicCheckResult> {
  const repository = getRepository();
  const [documents, links] = await Promise.all([
    repository.listItems({ kind: "document" }),
    repository.listLinks(),
  ]);
  const items = new Map(
    (await repository.listItems()).map((item) => [item.id, item]),
  );
  const tasks: EnqueueInput[] = [];

  for (const document of documents) {
    if (document.status === "retired") continue;
    const reviewOn = nextReviewDate(document);
    if (!reviewOn || reviewOn <= addDays(on, DUE_SOON_DAYS)) {
      tasks.push({
        kind: "stale",
        itemId: document.id,
        source: "schedule",
        trigger: !reviewOn
          ? "Never checked. Every document gets a check at least once a year."
          : reviewOn < on
            ? `Review was due on ${formatDate(reviewOn)}.`
            : `Review is due on ${formatDate(reviewOn)}.`,
        dueAt: reviewOn && reviewOn > on ? reviewOn : undefined,
      });
      continue;
    }

    const checkBefore = addDays(on, -USED_CHECK_WITHIN_DAYS);
    if (document.lastCheckedAt && document.lastCheckedAt >= checkBefore) {
      continue;
    }
    const lastChecked = document.lastCheckedAt ?? "";
    const answers = links.filter(
      (link) =>
        link.type === "answered_with" &&
        link.toId === document.id &&
        (items.get(link.fromId)?.createdAt.slice(0, 10) ?? "") > lastChecked,
    );
    if (answers.length > 0) {
      tasks.push({
        kind: "stale",
        itemId: document.id,
        source: "usage",
        trigger: `Used in ${answers.length} customer ${
          answers.length === 1 ? "answer" : "answers"
        } since the last check on ${formatDate(lastChecked)}.`,
      });
    }
  }

  for (const link of links) {
    if (link.type !== "contradicts" || link.status !== "suggested") continue;
    tasks.push({
      kind: "conflict",
      itemId: link.toId,
      relatedItemIds: [link.fromId],
      linkId: link.id,
      source: "conflict_check",
      trigger: link.reason,
    });
  }

  const result: PeriodicCheckResult = {
    queued: 0,
    alreadyQueued: 0,
    skipped: [],
  };
  for (const task of tasks) {
    const outcome = await enqueueReview(task);
    if (outcome.status === "queued") result.queued += 1;
    else if (outcome.status === "already_queued") result.alreadyQueued += 1;
    else result.skipped.push({ itemId: task.itemId, message: outcome.message });
  }
  return result;
}

export type DocumentUpdate = {
  body: string;
  /** The sentence that is replaced, or null when the new text is added at the end. */
  before: string | null;
  after: string;
};

/** What "update the document" writes: the disputed sentence swapped for the newer one. */
export function documentUpdate(
  item: KnowledgeItem,
  link: KnowledgeLink,
  other: KnowledgeItem,
  on: string,
): DocumentUpdate | null {
  if (!link.evidence) return null;
  if (link.toEvidence && item.body.includes(link.toEvidence)) {
    return {
      body: item.body.replace(link.toEvidence, link.evidence),
      before: link.toEvidence,
      after: link.evidence,
    };
  }
  const after = `Update ${formatDate(on)} (${other.title}): ${link.evidence}`;
  return { body: `${item.body}\n\n${after}`, before: null, after };
}

export type Outcome = {
  id: string;
  label: string;
  hint: string;
};

const checked: Outcome = {
  id: "still_correct",
  label: "Still correct",
  hint: "Sets the last check to today and the next review to a year from now.",
};
const retire: Outcome = {
  id: "retire",
  label: "Outdated, retire it",
  hint: "The document is no longer used in answers.",
};

export function outcomesFor(
  review: ReviewItem,
  link: KnowledgeLink | null,
): Outcome[] {
  switch (review.kind) {
    case "stale":
    case "parent_changed":
      return [checked, retire];
    case "conflict":
      return [
        ...(link?.evidence
          ? [
              {
                id: "add_to_document",
                label: "Update the document",
                hint: "The newer source is right. Its sentence goes into the document and the document is marked checked.",
              },
            ]
          : []),
        {
          id: "document_right",
          label: "Keep the document as it is",
          hint: "The document is right. The conflict is closed and the document is marked checked.",
        },
        {
          id: "different_scope",
          label: "Both are right, for different cases",
          hint: "They apply to different countries, customers or groups of employees. Nothing changes.",
        },
        {
          ...retire,
          label: "Retire the document",
          hint: "The newer source is right and the document is no longer worth keeping. It stops being used in answers.",
        },
      ];
    case "no_owner":
      return [
        {
          id: "take_ownership",
          label: "I will own it",
          hint: "You become the owner and get its future review tasks.",
        },
      ];
    case "suggested_link":
      if (link?.type === "supersedes") {
        return [
          {
            id: "confirm",
            label: "Yes, the newer one replaces it",
            hint: "Your document is no longer used in answers. The newer source is used instead.",
          },
          {
            id: "reject",
            label: "No, my document is still right",
            hint: "Both stay in use. The suggestion is dropped.",
          },
        ];
      }
      if (link?.type === "duplicate_of") {
        return [
          {
            id: "confirm",
            label: "Yes, it is a copy",
            hint: "The copy points to your document and is not used in answers.",
          },
          {
            id: "reject",
            label: "No, they are different",
            hint: "Both stay in use. The suggestion is dropped.",
          },
        ];
      }
      return [
        {
          id: "confirm",
          label: "Confirm",
          hint: "The suggestion counts from now on.",
        },
        { id: "reject", label: "Reject", hint: "The suggestion is dropped." },
      ];
    case "suggested_label":
      return [
        {
          id: "confirm",
          label: "Confirm",
          hint: "The suggestion counts from now on.",
        },
        { id: "reject", label: "Reject", hint: "The suggestion is dropped." },
      ];
  }
}

const labelFields = [
  "country",
  "customerId",
  "teamId",
  "product",
  "jointCommittee",
  "ownerId",
] as const;

async function applyOutcome(
  outcome: string,
  review: ReviewItem,
  item: KnowledgeItem,
  link: KnowledgeLink | null,
  actor: Colleague,
  on: string,
): Promise<string> {
  const repository = getRepository();
  const markChecked = () =>
    repository.updateItem(item.id, {
      lastCheckedAt: on,
      nextReviewAt: monthsBefore(on, -REVIEW_EVERY_MONTHS),
    });

  switch (outcome) {
    case "still_correct":
      await markChecked();
      return `Checked ${item.title}`;
    case "retire":
      await repository.updateItem(item.id, { status: "retired" });
      if (link?.status === "suggested") {
        await repository.resolveLink(link.id, "confirmed", actor.id);
      }
      return `Retired ${item.title}`;
    case "document_right":
    case "different_scope":
      if (link) await repository.resolveLink(link.id, "rejected", actor.id);
      await markChecked();
      return `Settled a conflict on ${item.title}`;
    case "add_to_document": {
      const other = link
        ? await repository.getItem(
            link.fromId === item.id ? link.toId : link.fromId,
          )
        : null;
      const update =
        link && other ? documentUpdate(item, link, other, on) : null;
      if (!link || !other || !update) {
        throw new Error("There is no passage to add.");
      }
      await repository.updateItem(item.id, { body: update.body });
      await repository.resolveLink(link.id, "rejected", actor.id);
      await repository.createLink({
        fromId: other.id,
        toId: item.id,
        type: "supports",
        reason: `${actor.name} updated the document with this passage.`,
        evidence: link.evidence,
        toEvidence: update.after,
        status: "confirmed",
        origin: "person",
        confidence: null,
        createdBy: actor.id,
      });
      await markChecked();
      return `Updated ${item.title} with a newer source`;
    }
    case "take_ownership":
      await repository.updateItem(item.id, { ownerId: actor.id });
      return `Took ownership of ${item.title}`;
    case "confirm":
    case "reject": {
      const confirmed = outcome === "confirm";
      if (link) {
        await repository.resolveLink(
          link.id,
          confirmed ? "confirmed" : "rejected",
          actor.id,
        );
      }
      const field = labelFields.find((name) => name === review.payload?.field);
      if (confirmed && field && review.payload) {
        await repository.updateItem(item.id, { [field]: review.payload.value });
      }
      return `${confirmed ? "Confirmed" : "Rejected"} a suggestion on ${item.title}`;
    }
    default:
      throw new Error(`Unknown outcome ${outcome}.`);
  }
}

export type ResolveResult =
  | { ok: true; reward: Reward; message: string }
  | { ok: false; message: string };

export async function resolveReview(
  reviewId: string,
  outcome: string,
  actor: Colleague,
): Promise<ResolveResult> {
  const repository = getRepository();
  const review = await repository.getReviewItem(reviewId);
  if (!review || review.status !== "open") {
    return { ok: false, message: "This task is already done." };
  }
  if (review.assigneeId !== actor.id) {
    return { ok: false, message: "Only the assignee can decide on this task." };
  }
  const [itemId] = review.itemIds;
  const item = itemId ? await repository.getItem(itemId) : null;
  if (!item) {
    return { ok: false, message: "The document for this task is gone." };
  }
  const link = review.linkId
    ? ((await repository.listLinks({ itemId: item.id })).find(
        (entry) => entry.id === review.linkId,
      ) ?? null)
    : null;
  if (!outcomesFor(review, link).some((option) => option.id === outcome)) {
    return { ok: false, message: "That is not an option for this task." };
  }

  const resolved = await repository.resolveReviewItem(
    review.id,
    outcome,
    actor.id,
  );
  if (!resolved) {
    return { ok: false, message: "This task is already done." };
  }

  const on = today();
  const reason = await applyOutcome(outcome, review, item, link, actor, on);
  const reward = rewardFor(review, on);
  await repository.createKarmaEvent({
    colleagueId: actor.id,
    reviewId: review.id,
    kind: review.kind,
    itemId: item.id,
    points: reward.points,
    onTime: reward.onTime,
    reason,
  });
  return { ok: true, reward, message: reason };
}

export async function reassignReview(
  reviewId: string,
  toColleagueId: string,
  actor: Colleague,
): Promise<{ ok: boolean; message: string }> {
  const repository = getRepository();
  const review = await repository.getReviewItem(reviewId);
  if (!review || review.status !== "open") {
    return { ok: false, message: "This task is already done." };
  }
  const mayMove =
    review.assigneeId === actor.id ||
    (review.assigneeId === null && review.assigneeTeamId === actor.teamId);
  if (!mayMove) {
    return { ok: false, message: "Only the assignee can hand this task on." };
  }
  const target = await repository.getColleague(toColleagueId);
  if (!target || target.status !== "active") {
    return { ok: false, message: "Pick an active colleague." };
  }
  await repository.updateReviewItem(review.id, {
    assigneeId: target.id,
    assigneeTeamId: null,
  });
  return {
    ok: true,
    message:
      target.id === actor.id
        ? "Moved to your queue."
        : `Moved to ${target.name}'s queue.`,
  };
}
