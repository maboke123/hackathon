"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { FormState } from "@/lib/form-state";

const inputSchema = z.object({
  linkId: z.string().min(1),
  question: z.string().trim().min(1).max(500),
});

export async function sendConflictToOwner(input: unknown): Promise<FormState> {
  await requireUser();
  const parsed = inputSchema.safeParse(input);
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

  const open = await repository.listReviewItems({
    itemId: link.toId,
    status: "open",
  });
  if (open.some((review) => review.linkId === link.id)) {
    return { status: "success", message: "Already in the owner's queue." };
  }

  const document = await repository.getItem(link.toId);
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

  await repository.createReviewItem({
    kind: "conflict",
    itemIds: [link.toId, link.fromId],
    linkId: link.id,
    assigneeId: assignee?.id ?? null,
    assigneeTeamId: assignee ? null : (document?.teamId ?? null),
    trigger: `Asked during a call: "${question}"`,
    payload: null,
  });

  revalidatePath("/ask");
  revalidatePath("/review");
  revalidatePath("/overview");
  return { status: "success", message: "Sent to the owner's queue." };
}
