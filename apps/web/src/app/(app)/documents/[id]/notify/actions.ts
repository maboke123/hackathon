"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { FormState } from "@/lib/form-state";
import { canManageUpload, listAffected, notifyAffected } from "@/lib/upload";

const notifySchema = z.object({
  itemId: z.string().min(1).max(64),
  answers: z.array(z.string().min(1).max(80)).max(50),
  dependents: z.array(z.string().min(1).max(64)).max(50),
  messages: z.array(
    z.string().trim().min(20, "A correction needs a message.").max(5000),
  ),
});

export async function notifyAffectedAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const answers = formData.getAll("answer").map(String);
  const parsed = notifySchema.safeParse({
    itemId: formData.get("itemId"),
    answers,
    dependents: formData.getAll("dependent").map(String),
    messages: answers.map((id) => String(formData.get(`message-${id}`) ?? "")),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the selection.",
    };
  }

  const item = await getRepository().getItem(parsed.data.itemId);
  if (!item || !colleague || !canManageUpload(item, colleague, user.role)) {
    return {
      status: "error",
      message: "Only the owner of this document can send corrections.",
    };
  }
  if (parsed.data.answers.length + parsed.data.dependents.length === 0) {
    return {
      status: "error",
      message: "Select at least one customer or document.",
    };
  }

  const affected = await listAffected(item);
  const answerIds = new Set(affected.answers.map((entry) => entry.answer.id));
  const dependentIds = new Set(
    affected.dependents.map((entry) => entry.item.id),
  );
  if (
    !parsed.data.answers.every((id) => answerIds.has(id)) ||
    !parsed.data.dependents.every((id) => dependentIds.has(id))
  ) {
    return {
      status: "error",
      message: "The selection is out of date. Reload the page.",
    };
  }

  const result = await notifyAffected(
    item,
    affected,
    {
      answers: new Map(
        parsed.data.answers.map((id, index) => [
          id,
          parsed.data.messages[index] ?? "",
        ]),
      ),
      dependentIds: new Set(parsed.data.dependents),
    },
    colleague,
  );

  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      [
        result.sent > 0
          ? `${result.sent} ${result.sent === 1 ? "correction" : "corrections"} sent.`
          : null,
        result.queued > 0
          ? `${result.queued} ${result.queued === 1 ? "owner" : "owners"} asked to check.`
          : null,
        result.withoutOwner.length > 0
          ? `No owner yet for ${result.withoutOwner.join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join(" ") || "Nothing new to send.",
  };
}
