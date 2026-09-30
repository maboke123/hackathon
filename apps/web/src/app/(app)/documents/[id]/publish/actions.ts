"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import { documentTypeSchema, getRepository, languageSchema } from "@/lib/data";
import { type FormState, invalidForm } from "@/lib/form-state";
import { type Relation, relationSchema } from "@/lib/relations";
import {
  allowedRelations,
  canManageUpload,
  findRelated,
  publishDraft,
} from "@/lib/upload";

const idSchema = z.string().min(1).max(64);
const optional = z
  .string()
  .max(64)
  .transform((value) => value || null);

const labelsSchema = z.object({
  itemId: idSchema,
  title: z.string().trim().min(3, "Give the document a title.").max(200),
  ownerId: z.string().min(1, "Pick an owner.").max(64),
  teamId: z.string().min(1, "Pick a team.").max(64),
  country: optional,
  customerId: optional,
  subject: z.string().trim().min(2, "Name the topic.").max(80),
  documentType: documentTypeSchema,
  language: languageSchema,
});

async function loadDraft(itemId: string) {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const item = await getRepository().getItem(itemId);
  if (!item || !canManageUpload(item, colleague, user.role)) return null;
  return { item, colleague };
}

export async function saveLabels(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = Object.fromEntries(
    Object.keys(labelsSchema.shape).map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );
  const parsed = labelsSchema.safeParse(values);
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }
  const draft = await loadDraft(parsed.data.itemId);
  if (!draft || draft.item.status !== "draft") {
    return {
      status: "error",
      message: "Only the uploader can change this draft.",
    };
  }

  const repository = getRepository();
  const [owner, team, customer] = await Promise.all([
    repository.getColleague(parsed.data.ownerId),
    repository.listTeams(),
    parsed.data.customerId
      ? repository.getCustomer(parsed.data.customerId)
      : Promise.resolve(null),
  ]);
  if (owner?.status !== "active") {
    return { status: "error", message: "Pick an owner who still works here." };
  }
  if (!team.some((entry) => entry.id === parsed.data.teamId)) {
    return { status: "error", message: "Pick one of the teams." };
  }
  if (parsed.data.customerId && !customer) {
    return { status: "error", message: "Pick one of the customers." };
  }

  const { itemId, ...update } = parsed.data;
  await repository.updateItem(itemId, { ...update, labelStatus: "labelled" });
  revalidatePath(`/documents/${itemId}/publish`);
  return {
    status: "success",
    message: "Labels saved. Related documents checked again.",
  };
}

export async function publishDocument(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const itemId = idSchema.safeParse(formData.get("itemId"));
  if (!itemId.success) {
    return { status: "error", message: "This draft does not exist." };
  }
  const draft = await loadDraft(itemId.data);
  if (!draft?.colleague || draft.item.status !== "draft") {
    return {
      status: "error",
      message: "Only the uploader can publish this draft.",
    };
  }
  const { item, colleague } = draft;

  const related = await findRelated(item);
  const choices = new Map<string, Relation>();
  for (const entry of related) {
    const choice = relationSchema.safeParse(
      formData.get(`relation-${entry.item.id}`),
    );
    if (!choice.success || !allowedRelations(entry).includes(choice.data)) {
      return {
        status: "error",
        message: entry.conflict
          ? `Decide the conflict with ${entry.item.title} first.`
          : `Pick how ${entry.item.title} relates to your document.`,
      };
    }
    choices.set(entry.item.id, choice.data);
  }

  const result = await publishDraft(item, choices, colleague);
  revalidatePath("/", "layout");
  if (result.superseded > 0) redirect(`/documents/${item.id}/notify`);
  redirect(`/documents/${item.id}?published=1`);
}

export async function discardDraft(formData: FormData): Promise<void> {
  const itemId = idSchema.safeParse(formData.get("itemId"));
  if (!itemId.success) return;
  const draft = await loadDraft(itemId.data);
  if (!draft || draft.item.status !== "draft") return;
  await getRepository().deleteItem(draft.item.id);
  revalidatePath("/documents");
  redirect("/documents");
}
