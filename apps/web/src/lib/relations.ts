import { z } from "zod";

export const relationSchema = z.enum([
  "supersedes",
  "based_on",
  "variant_of",
  "contradicts",
  "none",
]);

export type Relation = z.infer<typeof relationSchema>;

export const relationLabels: Record<Relation, { label: string; hint: string }> =
  {
    supersedes: {
      label: "Yours replaces it",
      hint: "It is no longer used in answers. Next you can tell who relied on it.",
    },
    based_on: {
      label: "Yours is based on it",
      hint: "When it changes, your document comes to you for a check.",
    },
    variant_of: {
      label: "Different scope",
      hint: "Both stay in use, each for its own country or customer.",
    },
    contradicts: {
      label: "Ask the owner",
      hint: "The owner decides which one is right. Until then neither gives a confident answer.",
    },
    none: { label: "Not related", hint: "No link." },
  };

export const conflictLabels: Partial<Record<Relation, string>> = {
  supersedes: "Mine is right, it replaces this one",
  variant_of: "Both are right, for a different scope",
  contradicts: "Not sure, ask the owner",
};
