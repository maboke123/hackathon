"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
<<<<<<< Updated upstream
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
=======
import { requireUser } from "@/lib/auth/session";
import { getRepository, type KnowledgeItem } from "@/lib/data";
>>>>>>> Stashed changes
import type { FormState } from "@/lib/form-state";
import { enqueueReview } from "@/lib/review";

const questionSchema = z.string().trim().max(500);

async function routeTo(document: KnowledgeItem | null) {
  const repository = getRepository();
  const owner = document?.ownerId
    ? await repository.getColleague(document.ownerId)
    : null;
  const successor = owner?.successorId
    ? await repository.getColleague(owner.successorId)
    : null;
  const assignee =
    owner?.status === "active"
      ? owner
      : successor?.status === "active"
        ? successor
        : null;
  return {
    assigneeId: assignee?.id ?? null,
    assigneeTeamId: assignee ? null : (document?.teamId ?? null),
    name: assignee?.name ?? "the team",
  };
}

function revalidateQueues() {
  revalidatePath("/ask");
  revalidatePath("/review");
  revalidatePath("/overview");
}

const conflictSchema = z.object({
  linkId: z.string().min(1),
  question: questionSchema,
});

export async function sendConflictToOwner(input: unknown): Promise<FormState> {
  await requireUser();
  const parsed = conflictSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "This conflict could not be found." };
  }

  const repository = getRepository();
  const { linkId, question } = parsed.data;
  const [link] = (await repository.listLinks({ type: "contradicts" })).filter(
    (entry) => entry.id === linkId && entry.status !== "rejected",
  );
  if (!link) {
    return { status: "error", message: "This conflict is already settled." };
  }

  const colleague = await getCurrentColleague();
  const result = await enqueueReview({
    kind: "conflict",
    itemId: link.toId,
    relatedItemIds: [link.fromId],
    linkId: link.id,
    source: "request",
    requestedById: colleague?.id ?? null,
    trigger: `Asked during a call: "${question}"`,
  });
  if (result.status === "rejected") {
    return { status: "error", message: result.message };
  }

<<<<<<< Updated upstream
  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      result.status === "queued"
        ? "Sent to the owner's queue."
        : "Already in the owner's queue. Marked as urgent.",
  };
=======
  const route = await routeTo(await repository.getItem(link.toId));
  await repository.createReviewItem({
    kind: "conflict",
    itemIds: [link.toId, link.fromId],
    linkId: link.id,
    assigneeId: route.assigneeId,
    assigneeTeamId: route.assigneeTeamId,
    trigger: `Asked during a call: "${question}"`,
    payload: null,
  });

  revalidateQueues();
  return { status: "success", message: `Sent to ${route.name}'s queue.` };
}

const checkSchema = z.object({
  itemId: z.string().min(1),
  question: questionSchema,
});

export async function requestCheck(input: unknown): Promise<FormState> {
  const user = await requireUser();
  const parsed = checkSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "This document could not be found." };
  }

  const repository = getRepository();
  const { itemId, question } = parsed.data;
  const document = await repository.getItem(itemId);
  if (!document || document.kind !== "document") {
    return { status: "error", message: "This document could not be found." };
  }

  const route = await routeTo(document);
  const open = await repository.listReviewItems({ itemId, status: "open" });
  if (
    open.some(
      (review) =>
        review.kind === "stale" &&
        review.assigneeId === route.assigneeId &&
        review.assigneeTeamId === route.assigneeTeamId,
    )
  ) {
    return {
      status: "success",
      message: `Already in ${route.name}'s queue for a check.`,
    };
  }

  await repository.createReviewItem({
    kind: "stale",
    itemIds: [itemId],
    linkId: null,
    assigneeId: route.assigneeId,
    assigneeTeamId: route.assigneeTeamId,
    trigger: question
      ? `${user.name} asked for a check during a call: "${question}"`
      : `${user.name} asked for a check.`,
    payload: null,
  });

  revalidateQueues();
  return { status: "success", message: `Asked ${route.name} to check it.` };
>>>>>>> Stashed changes
}
