"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { FormState } from "@/lib/form-state";

export async function resetDemoData(): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "hr") {
    return { status: "error", message: "Only HR can reset the demo data." };
  }

  await getRepository().reset();
  revalidatePath("/", "layout");

  return { status: "success", message: "Demo data restored." };
}
