import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
// drizzle-kit loads this file outside Next.js, so imports are relative.
import { roles } from "../auth/roles";
import type {
  AgentResult,
  ColleagueStatus,
  CustomerContact,
  CustomerEntity,
  ItemKind,
  ItemStatus,
  Language,
  LinkOrigin,
  LinkStatus,
  LinkType,
  ReviewKind,
  ReviewPayload,
  ReviewStatus,
  SourceSystem,
} from "../data/types";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});
const instant = () => timestamp({ withTimezone: true, mode: "string" });

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text({ enum: roles }).default("colleague").notNull(),
  // No foreign key: reset() replaces colleagues but keeps their ids.
  colleagueId: text(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const teams = pgTable("teams", {
  id: text().primaryKey(),
  name: text().notNull(),
});

export const colleagues = pgTable(
  "colleagues",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    jobTitle: text().notNull(),
    teamId: text()
      .notNull()
      .references(() => teams.id),
    country: text(),
    location: text(),
    languages: text().array().notNull(),
    status: text().$type<ColleagueStatus>().notNull(),
    startDate: date().notNull(),
    endDate: date(),
    successorId: text(),
  },
  (table) => [index("colleagues_team_id_idx").on(table.teamId)],
);

export const customers = pgTable("customers", {
  id: text().primaryKey(),
  name: text().notNull(),
  segment: text().notNull(),
  since: text(),
  headquarters: text(),
  countries: text().array().notNull(),
  note: text(),
  contacts: jsonb().$type<CustomerContact[]>().notNull(),
  entities: jsonb().$type<CustomerEntity[]>().notNull(),
});

export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: text().primaryKey(),
    kind: text().$type<ItemKind>().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    filePath: text().notNull(),
    pdfPath: text(),
    sourceSystem: text().$type<SourceSystem>().notNull(),
    location: text().notNull(),
    language: text().$type<Language>().notNull(),
    country: text(),
    customerId: text().references(() => customers.id),
    teamId: text().references(() => teams.id),
    product: text(),
    jointCommittee: text(),
    keywords: text().array().notNull(),
    ownerId: text().references(() => colleagues.id),
    authorId: text().references(() => colleagues.id),
    createdAt: instant().notNull(),
    modifiedAt: instant().notNull(),
    modifiedById: text().references(() => colleagues.id),
    lastCheckedAt: date(),
    nextReviewAt: date(),
    status: text().$type<ItemStatus>().notNull(),
    usefulness: real(),
    usefulnessScoredAt: instant(),
    embedding: real().array(),
    search: tsvector()
      .notNull()
      .generatedAlwaysAs(
        sql`setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(body, '')), 'B')`,
      ),
  },
  (table) => [
    index("knowledge_items_search_idx").using("gin", table.search),
    index("knowledge_items_owner_id_idx").on(table.ownerId),
    index("knowledge_items_customer_id_idx").on(table.customerId),
  ],
);

export const knowledgeLinks = pgTable(
  "knowledge_links",
  {
    id: text().primaryKey(),
    fromId: text()
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: "cascade" }),
    toId: text()
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: "cascade" }),
    type: text().$type<LinkType>().notNull(),
    reason: text().notNull(),
    evidence: text(),
    status: text().$type<LinkStatus>().notNull(),
    origin: text().$type<LinkOrigin>().notNull(),
    confidence: real(),
    createdBy: text().notNull(),
    createdAt: instant().notNull(),
    resolvedBy: text(),
    resolvedAt: instant(),
  },
  (table) => [
    unique("knowledge_links_from_to_type_unique").on(
      table.fromId,
      table.toId,
      table.type,
    ),
    index("knowledge_links_to_id_idx").on(table.toId),
  ],
);

export const reviewItems = pgTable(
  "review_items",
  {
    id: text().primaryKey(),
    kind: text().$type<ReviewKind>().notNull(),
    itemIds: text().array().notNull(),
    linkId: text().references(() => knowledgeLinks.id, {
      onDelete: "set null",
    }),
    assigneeId: text().references(() => colleagues.id),
    assigneeTeamId: text().references(() => teams.id),
    trigger: text().notNull(),
    payload: jsonb().$type<ReviewPayload>(),
    status: text().$type<ReviewStatus>().notNull(),
    outcome: text(),
    createdAt: instant().notNull(),
    resolvedBy: text(),
    resolvedAt: instant(),
  },
  (table) => [
    index("review_items_assignee_id_idx").on(table.assigneeId),
    index("review_items_status_idx").on(table.status),
  ],
);

export const agentQueries = pgTable("agent_queries", {
  id: text().primaryKey(),
  askedAt: instant().notNull(),
  askedBy: text().notNull(),
  askedById: text(),
  question: text().notNull(),
  results: jsonb().$type<AgentResult[]>().notNull(),
  answer: text().notNull(),
  feedback: text(),
});
