"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { enqueueReview } from "@/lib/review";

const checkSchema = z.object({
  itemId: z.string().min(1),
  question: z.string().trim().max(500),
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
