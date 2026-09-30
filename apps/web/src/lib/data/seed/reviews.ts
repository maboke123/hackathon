import type { ReviewKind, ReviewPayload, ReviewSource } from "../types";

export type SeedReview = {
  kind: ReviewKind;
  source: ReviewSource;
  itemId: string;
  otherItemId?: string;
  trigger: string;
  payload?: ReviewPayload;
  assigneeId?: string;
  requestedById?: string;
};

// Tasks the corpus alone does not produce, so every review kind is in the demo (docs/plan.md, 3.5).
export const seedReviews: SeedReview[] = [
  {
    kind: "parent_changed",
    source: "parent_change",
    itemId: "doc-06",
    otherItemId: "doc-07",
    trigger:
      "Maaltijdcheques vanaf 1 januari 2026 changed the maximum face value from EUR 8 to EUR 10. This instruction still says EUR 8.",
  },
  {
    kind: "stale",
    source: "request",
    itemId: "doc-10",
    trigger:
      "Lotte Verhaegen asked during a call whether the EUR 250 maximum still applies in 2026.",
    assigneeId: "p-bram",
    requestedById: "p-lotte",
  },
  {
    kind: "suggested_label",
    source: "conflict_check",
    itemId: "doc-21",
    trigger:
      "Elif Aydin takes over the Veldra account from Jonas Peeters. The handover notes have no owner.",
    payload: { field: "ownerId", value: "p-elif", confidence: 0.88 },
    assigneeId: "p-elif",
  },
  {
    kind: "suggested_label",
    source: "conflict_check",
    itemId: "doc-04",
    trigger:
      "Copy of the Belgian birth leave update. Its OneDrive path names no country.",
    payload: { field: "country", value: "BE", confidence: 0.96 },
  },
  {
    kind: "suggested_label",
    source: "conflict_check",
    itemId: "doc-15",
    trigger:
      "Draft without an owner. Pieter De Smedt answers most pay transparency questions in the legal channel. Low confidence, so a person decides.",
    payload: { field: "ownerId", value: "p-pieter", confidence: 0.58 },
    assigneeId: "p-pieter",
  },
];
