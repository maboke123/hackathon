"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentColleague } from "@/lib/auth/session";
import { type FormState, invalidForm } from "@/lib/form-state";
import { createDraft, MAX_UPLOAD_CHARS, readUpload } from "@/lib/upload";

const uploadSchema = z.object({
  title: z.string().trim().max(200, "Keep the title under 200 characters."),
  fileName: z
    .string()
    .trim()
    .max(200)
    .regex(/^$|^[^/\\]+\.(md|markdown|txt)$/i, "Upload a .md or .txt file."),
  text: z
    .string()
    .trim()
    .min(80, "Add a file or paste the text of the document.")
    .max(MAX_UPLOAD_CHARS, "This document is too long for the demo."),
});

export async function uploadDocument(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const colleague = await getCurrentColleague();
  const values = {
    title: String(formData.get("title") ?? ""),
    fileName: String(formData.get("fileName") ?? ""),
    text: String(formData.get("text") ?? ""),
  };
  const parsed = uploadSchema.safeParse(values);
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }
  if (!colleague) {
    return {
      status: "error",
      message:
        "Your account is not linked to a colleague, so nobody would own this document.",
    };
  }

  const upload = readUpload(parsed.data.text, parsed.data.fileName || null);
  const item = await createDraft({
    title: parsed.data.title || upload.title,
    body: upload.body,
    fileName: parsed.data.fileName || null,
    uploader: colleague,
  });
  redirect(`/documents/${item.id}/publish`);
}
