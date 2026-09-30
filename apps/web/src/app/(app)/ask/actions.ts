"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { FormState } from "@/lib/form-state";
import { enqueueReview } from "@/lib/review";

const questionSchema = z.string().trim().max(500);

const conflictSchema = z.object({
  linkId: z.string().min(1),
  question: questionSchema.min(1),
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

  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      result.status === "queued"
        ? "Sent to the owner's queue."
        : "Already in the owner's queue. Marked as urgent.",
  };
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

  const { itemId, question } = parsed.data;
  const colleague = await getCurrentColleague();
  const result = await enqueueReview({
    kind: "stale",
    itemId,
    source: "request",
    requestedById: colleague?.id ?? null,
    trigger: question
      ? `${user.name} asked for a check during a call: "${question}"`
      : `${user.name} asked for a check.`,
  });
  if (result.status === "rejected") {
    return { status: "error", message: result.message };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      result.status === "queued"
        ? "Asked the owner to check it."
        : "Already in the owner's queue. Marked as urgent.",
  };
}
