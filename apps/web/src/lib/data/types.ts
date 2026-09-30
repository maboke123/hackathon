import { z } from "zod";

const isoDate = z.iso.date();
const timestamp = z.string().min(1);

export const languageSchema = z.enum(["nl", "fr", "en", "de", "es"]);
export const colleagueStatusSchema = z.enum([
  "active",
  "left",
  "service_account",
]);
export const itemKindSchema = z.enum([
  "document",
  "email",
  "call",
  "meeting",
  "chat",
  "ticket",
  "answer",
]);
export const sourceSystemSchema = z.enum([
  "sharepoint",
  "onedrive",
  "wiki",
  "outlook",
  "teams",
  "telephony",
  "service_desk",
]);
export const itemStatusSchema = z.enum(["active", "draft", "retired"]);
export const linkTypeSchema = z.enum([
  "supersedes",
  "contradicts",
  "variant_of",
  "duplicate_of",
  "supports",
  "based_on",
  "answered_with",
]);
export const linkStatusSchema = z.enum(["suggested", "confirmed", "rejected"]);
export const linkOriginSchema = z.enum(["parsed", "seed", "jev", "person"]);
export const reviewKindSchema = z.enum([
  "conflict",
  "parent_changed",
  "stale",
  "no_owner",
  "suggested_link",
  "suggested_label",
]);
export const reviewStatusSchema = z.enum(["open", "done"]);
export const reviewSourceSchema = z.enum([
  "schedule",
  "usage",
  "request",
  "conflict_check",
  "parent_change",
]);

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const colleagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  jobTitle: z.string(),
  teamId: z.string(),
  country: z.string().nullable(),
  location: z.string().nullable(),
  languages: z.array(z.string()),
  status: colleagueStatusSchema,
  startDate: isoDate,
  endDate: isoDate.nullable(),
  successorId: z.string().nullable(),
});

export const customerContactSchema = z.object({
  name: z.string(),
  role: z.string(),
  email: z.string(),
});

export const customerEntitySchema = z
  .object({ country: z.string(), entity: z.string() })
  .catchall(z.union([z.string(), z.number(), z.null()]));

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  segment: z.string(),
  since: z.string().nullable(),
  headquarters: z.string().nullable(),
  countries: z.array(z.string()),
  note: z.string().nullable(),
  contacts: z.array(customerContactSchema),
  entities: z.array(customerEntitySchema),
});

export const knowledgeItemSchema = z.object({
  id: z.string(),
  kind: itemKindSchema,
  title: z.string(),
  body: z.string(),
  filePath: z.string(),
  pdfPath: z.string().nullable(),
  sourceSystem: sourceSystemSchema,
  location: z.string(),
  language: languageSchema,
  country: z.string().nullable(),
  customerId: z.string().nullable(),
  teamId: z.string().nullable(),
  product: z.string().nullable(),
  jointCommittee: z.string().nullable(),
  keywords: z.array(z.string()),
  ownerId: z.string().nullable(),
  authorId: z.string().nullable(),
  createdAt: timestamp,
  modifiedAt: timestamp,
  modifiedById: z.string().nullable(),
  lastCheckedAt: isoDate.nullable(),
  nextReviewAt: isoDate.nullable(),
  status: itemStatusSchema,
  usefulness: z.number().min(0).max(1).nullable(),
  usefulnessScoredAt: timestamp.nullable(),
});

export const knowledgeLinkSchema = z.object({
  id: z.string(),
  fromId: z.string(),
  toId: z.string(),
  type: linkTypeSchema,
  reason: z.string(),
  evidence: z.string().nullable(),
  toEvidence: z.string().nullable(),
  status: linkStatusSchema,
  origin: linkOriginSchema,
  confidence: z.number().min(0).max(1).nullable(),
  createdBy: z.string(),
  createdAt: timestamp,
  resolvedBy: z.string().nullable(),
  resolvedAt: timestamp.nullable(),
});

export const reviewPayloadSchema = z.object({
  field: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const reviewItemSchema = z.object({
  id: z.string(),
  kind: reviewKindSchema,
  itemIds: z.array(z.string()).min(1),
  linkId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  assigneeTeamId: z.string().nullable(),
  trigger: z.string(),
  payload: reviewPayloadSchema.nullable(),
  source: reviewSourceSchema,
  requestedById: z.string().nullable(),
  dueAt: isoDate,
  status: reviewStatusSchema,
  outcome: z.string().nullable(),
  createdAt: timestamp,
  resolvedBy: z.string().nullable(),
  resolvedAt: timestamp.nullable(),
});

export const karmaEventSchema = z.object({
  id: z.string(),
  colleagueId: z.string(),
  reviewId: z.string().nullable(),
  kind: reviewKindSchema,
  itemId: z.string(),
  points: z.number().int().min(0),
  onTime: z.boolean(),
  reason: z.string(),
  createdAt: timestamp,
});

export const agentResultSchema = z.object({
  title: z.string(),
  path: z.string(),
  snippet: z.string(),
  score: z.number(),
  modified: z.string(),
  modifiedBy: z.string(),
  itemId: z.string().nullable(),
});

export const agentQuerySchema = z.object({
  id: z.string(),
  askedAt: timestamp,
  askedBy: z.string(),
  askedById: z.string().nullable(),
  question: z.string(),
  results: z.array(agentResultSchema),
  answer: z.string(),
  feedback: z.string().nullable(),
});

export const newLinkSchema = knowledgeLinkSchema.pick({
  fromId: true,
  toId: true,
  type: true,
  reason: true,
  evidence: true,
  toEvidence: true,
  status: true,
  origin: true,
  confidence: true,
  createdBy: true,
});

export const newReviewItemSchema = reviewItemSchema.pick({
  kind: true,
  itemIds: true,
  linkId: true,
  assigneeId: true,
  assigneeTeamId: true,
  trigger: true,
  payload: true,
  source: true,
  requestedById: true,
  dueAt: true,
});

export const reviewItemUpdateSchema = reviewItemSchema
  .pick({
    assigneeId: true,
    assigneeTeamId: true,
    trigger: true,
    source: true,
    requestedById: true,
    dueAt: true,
  })
  .partial();

export const newKarmaEventSchema = karmaEventSchema.omit({
  id: true,
  createdAt: true,
});

export const itemUpdateSchema = knowledgeItemSchema
  .pick({
    title: true,
    body: true,
    country: true,
    customerId: true,
    teamId: true,
    product: true,
    jointCommittee: true,
    keywords: true,
    ownerId: true,
    lastCheckedAt: true,
    nextReviewAt: true,
    status: true,
    usefulness: true,
    usefulnessScoredAt: true,
  })
  .partial();

export type Language = z.infer<typeof languageSchema>;
export type ColleagueStatus = z.infer<typeof colleagueStatusSchema>;
export type ItemKind = z.infer<typeof itemKindSchema>;
export type SourceSystem = z.infer<typeof sourceSystemSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type LinkType = z.infer<typeof linkTypeSchema>;
export type LinkStatus = z.infer<typeof linkStatusSchema>;
export type LinkOrigin = z.infer<typeof linkOriginSchema>;
export type ReviewKind = z.infer<typeof reviewKindSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewSource = z.infer<typeof reviewSourceSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Colleague = z.infer<typeof colleagueSchema>;
export type CustomerContact = z.infer<typeof customerContactSchema>;
export type CustomerEntity = z.infer<typeof customerEntitySchema>;
export type Customer = z.infer<typeof customerSchema>;
export type KnowledgeItem = z.infer<typeof knowledgeItemSchema>;
export type KnowledgeLink = z.infer<typeof knowledgeLinkSchema>;
export type ReviewPayload = z.infer<typeof reviewPayloadSchema>;
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type ReviewItemUpdate = z.infer<typeof reviewItemUpdateSchema>;
export type KarmaEvent = z.infer<typeof karmaEventSchema>;
export type NewKarmaEvent = z.infer<typeof newKarmaEventSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;
export type AgentQuery = z.infer<typeof agentQuerySchema>;
export type NewLink = z.infer<typeof newLinkSchema>;
export type NewReviewItem = z.infer<typeof newReviewItemSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
