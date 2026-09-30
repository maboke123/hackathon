import "server-only";
import { z } from "zod";
import {
  getRepository,
  type KnowledgeItem,
  type KnowledgeLink,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { addDays, today } from "@/lib/karma";
import { enqueueReview } from "@/lib/review";

const MAX_DEPTH = 5;
const NEXT_REVIEW_DAYS = 365;

export const recordChangeSchema = z.object({
  itemId: z.string().min(1).max(64),
  oldValue: z.string().trim().min(1, "Enter the old value.").max(200),
  newValue: z.string().trim().min(1, "Enter the new value.").max(200),
});

export type Downstream = {
  link: KnowledgeLink;
  item: KnowledgeItem;
  depth: number;
};

/** Everything based on the item, all levels down, within the item's country. */
export async function listDownstream(
  item: KnowledgeItem,
): Promise<Downstream[]> {
  const repository = getRepository();
  const found: Downstream[] = [];
  const seen = new Set([item.id]);
  let frontier = [item];
  for (let depth = 1; frontier.length > 0 && depth <= MAX_DEPTH; depth++) {
    const next: KnowledgeItem[] = [];
    for (const parent of frontier) {
      const links = await repository.listLinks({
        itemId: parent.id,
        type: "based_on",
        status: "confirmed",
      });
      for (const link of links.filter((entry) => entry.toId === parent.id)) {
        if (seen.has(link.fromId)) continue;
        seen.add(link.fromId);
        const child = await repository.getItem(link.fromId);
        if (!child || child.status === "retired") continue;
        if (item.country && child.country && child.country !== item.country) {
          continue;
        }
        found.push({ link, item: child, depth });
        next.push(child);
      }
    }
    frontier = next;
  }
  return found;
}

/** Downstream documents checked since the parent last changed. */
export function coverage(parent: KnowledgeItem, downstream: Downstream[]) {
  const checked = downstream.filter(
    ({ item }) =>
      parent.lastCheckedAt !== null &&
      item.lastCheckedAt !== null &&
      item.lastCheckedAt >= parent.lastCheckedAt,
  ).length;
  return { checked, total: downstream.length };
}

export type ChangeResult = {
  queued: number;
  withoutOwner: string[];
};

/**
 * Marks the parent as checked today and puts every document based on it in
 * its owner's queue, with the old value to look for.
 */
export async function recordChange(
  item: KnowledgeItem,
  oldValue: string,
  newValue: string,
  byName: string,
): Promise<ChangeResult> {
  const repository = getRepository();
  const on = today();
  await repository.updateItem(item.id, {
    lastCheckedAt: on,
    nextReviewAt: addDays(on, NEXT_REVIEW_DAYS),
  });

  const result: ChangeResult = { queued: 0, withoutOwner: [] };
  for (const { link, item: child } of await listDownstream(item)) {
    const mentions = child.body.includes(oldValue);
    const queued = await enqueueReview({
      kind: "parent_changed",
      itemId: child.id,
      relatedItemIds: [item.id],
      linkId: link.id,
      source: "parent_change",
      trigger: `${item.title} changed on ${formatDate(on)}: ${oldValue} is now ${newValue}. ${
        mentions
          ? `This document still says ${oldValue}.`
          : "Check whether this document is affected."
      } Recorded by ${byName}.`,
      payload: { field: oldValue, value: newValue, confidence: null },
    });
    if (queued.status === "rejected") {
      if (queued.reason === "no_owner") result.withoutOwner.push(child.title);
    } else {
      result.queued += 1;
    }
  }
  return result;
}
