"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { type FormState, invalidForm } from "@/lib/form-state";
import {
  enqueueReview,
  reassignReview,
  resolveReview,
  runPeriodicCheck,
} from "@/lib/review";

const notLinked: FormState = {
  status: "error",
  message: "This account is not linked to a colleague, so it has no queue.",
};

const resolveSchema = z.object({
  reviewId: z.string().min(1),
  outcome: z.string().min(1).max(40),
  scopes: z
    .array(
      z.object({
        itemId: z.string().min(1),
        country: z.string().max(2).nullable(),
        customerId: z.string().max(40).nullable(),
      }),
    )
    .max(2)
    .optional(),
});

export async function decideReview(
  input: unknown,
): Promise<FormState & { points?: number; bonus?: number }> {
  await requireUser();
  const colleague = await getCurrentColleague();
  if (!colleague) return notLinked;
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "This task could not be found." };
  }

  const result = await resolveReview(
    parsed.data.reviewId,
    parsed.data.outcome,
    colleague,
    parsed.data.scopes ?? null,
  );
  if (!result.ok) {
    return { status: "error", message: result.message };
  }
  revalidatePath("/", "layout");
  return {
    status: "success",
    message: `${result.message}.`,
    points: result.reward.points,
    bonus: result.reward.onTimeBonus + result.reward.requestBonus,
  };
}

const reassignSchema = z.object({
  reviewId: z.string().min(1),
  colleagueId: z.string().min(1),
});

export async function assignReview(input: unknown): Promise<FormState> {
  await requireUser();
  const colleague = await getCurrentColleague();
  if (!colleague) return notLinked;
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Pick a colleague." };
  }

  const result = await reassignReview(
    parsed.data.reviewId,
    parsed.data.colleagueId,
    colleague,
  );
  if (!result.ok) {
    return { status: "error", message: result.message };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: result.message };
}

const requestSchema = z.object({
  itemId: z.string().min(1, "Pick a document."),
  note: z
    .string()
    .trim()
    .min(5, "Tell the owner what to check.")
    .max(300, "Keep it under 300 characters."),
});

export async function requestReview(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const colleague = await getCurrentColleague();
  if (!colleague) return notLinked;
  const values = {
    itemId: String(formData.get("itemId") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }

  const result = await enqueueReview({
    kind: "stale",
    itemId: parsed.data.itemId,
    source: "request",
    requestedById: colleague.id,
    trigger: `${colleague.name} asked: "${parsed.data.note}"`,
  });
  if (result.status === "rejected") {
    return {
      status: "error",
      message: `${result.message} Ask the knowledge team to name one first.`,
      values,
    };
  }
  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      result.status === "queued"
        ? "Sent to the owner. They have two days."
        : "Already in the owner's queue. The deadline is now two days.",
  };
}

export async function checkAllDocuments(): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "knowledge_manager") {
    return {
      status: "error",
      message: "Only knowledge managers can run the periodic check.",
    };
  }

  const result = await runPeriodicCheck();
  revalidatePath("/", "layout");
  const skipped = result.skipped.length;
  return {
    status: "success",
    message: [
      result.queued === 0
        ? "No new tasks."
        : `${result.queued} new ${result.queued === 1 ? "task" : "tasks"} in owners' queues.`,
      skipped > 0
        ? `${skipped} ${skipped === 1 ? "document has" : "documents have"} no owner yet.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
}
