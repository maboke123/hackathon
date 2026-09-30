"use server";

import { revalidatePath } from "next/cache";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { type FormState, invalidForm } from "@/lib/form-state";
import { recordChange, recordChangeSchema } from "@/lib/changes";

export async function recordDocumentChange(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const values = {
    itemId: String(formData.get("itemId") ?? ""),
    oldValue: String(formData.get("oldValue") ?? ""),
    newValue: String(formData.get("newValue") ?? ""),
  };
  const parsed = recordChangeSchema.safeParse(values);
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }

  const item = await getRepository().getItem(parsed.data.itemId);
  if (!item || item.kind !== "document" || item.status === "retired") {
    return { status: "error", message: "This document cannot change." };
  }
  const isOwner = colleague !== null && item.ownerId === colleague.id;
  if (!isOwner && user.role !== "knowledge_manager") {
    return {
      status: "error",
      message: "Only the owner of this document can record a change.",
    };
  }

  const { queued, withoutOwner } = await recordChange(
    item,
    parsed.data.oldValue,
    parsed.data.newValue,
    colleague?.name ?? user.name,
  );

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: [
      queued === 0 && withoutOwner.length === 0
        ? "Change recorded. No other document is based on this one."
        : `Change recorded. ${queued} ${queued === 1 ? "document went" : "documents went"} to their owners.`,
      withoutOwner.length > 0
        ? `No owner yet for ${withoutOwner.join(", ")}. Name one first.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
}
