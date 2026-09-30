import "server-only";
import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  getTableColumns,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  agentQueries,
  colleagues,
  customers,
  knowledgeItems,
  knowledgeLinks,
  reviewItems,
  teams,
} from "@/lib/db/schema";
import type { DataRepository, ItemFilter } from "./repository";
import { searchTerms } from "./search-terms";
import { buildCorpusSeed } from "./seed/corpus";
import { itemUpdateSchema, newLinkSchema, newReviewItemSchema } from "./types";

const { search: _search, ...itemColumns } = getTableColumns(knowledgeItems);

function itemConditions(filter: ItemFilter): (SQL | undefined)[] {
  return [
    filter.kind ? eq(knowledgeItems.kind, filter.kind) : undefined,
    filter.status ? eq(knowledgeItems.status, filter.status) : undefined,
    filter.country ? eq(knowledgeItems.country, filter.country) : undefined,
    filter.customerId
      ? eq(knowledgeItems.customerId, filter.customerId)
      : undefined,
    filter.teamId ? eq(knowledgeItems.teamId, filter.teamId) : undefined,
    filter.ownerId ? eq(knowledgeItems.ownerId, filter.ownerId) : undefined,
  ];
}

function toTsQuery(query: string): string | null {
  const words = searchTerms(query);
  return words.length > 0 ? words.map((word) => `${word}:*`).join(" | ") : null;
}

const newId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

export function createDbRepository(db: Database): DataRepository {
  return {
    async listTeams() {
      return db.select().from(teams).orderBy(asc(teams.name));
    },

    async listColleagues() {
      return db.select().from(colleagues).orderBy(asc(colleagues.name));
    },

    async getColleague(id) {
      const [colleague] = await db
        .select()
        .from(colleagues)
        .where(eq(colleagues.id, id));
      return colleague ?? null;
    },

    async getColleagueByEmail(email) {
      const [colleague] = await db
        .select()
        .from(colleagues)
        .where(eq(sql`lower(${colleagues.email})`, email.trim().toLowerCase()));
      return colleague ?? null;
    },

    async listCustomers() {
      return db.select().from(customers).orderBy(asc(customers.name));
    },

    async getCustomer(id) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id));
      return customer ?? null;
    },

    async listItems(filter = {}) {
      return db
        .select(itemColumns)
        .from(knowledgeItems)
        .where(and(...itemConditions(filter)))
        .orderBy(asc(knowledgeItems.id));
    },

    async getItem(id) {
      const [item] = await db
        .select(itemColumns)
        .from(knowledgeItems)
        .where(eq(knowledgeItems.id, id));
      return item ?? null;
    },

    async searchItems(query, filter = {}) {
      const tsQuery = toTsQuery(query);
      if (!tsQuery) {
        return [];
      }
      const match = sql`to_tsquery('simple', ${tsQuery})`;
      const rank = sql<number>`ts_rank_cd(${knowledgeItems.search}, ${match})`;
      const rows = await db
        .select({ item: itemColumns, rank })
        .from(knowledgeItems)
        .where(
          and(
            sql`${knowledgeItems.search} @@ ${match}`,
            ...itemConditions(filter),
          ),
        )
        .orderBy(desc(rank), asc(knowledgeItems.id))
        .limit(50);
      return rows.map((row) => ({ item: row.item, rank: Number(row.rank) }));
    },

    async updateItem(id, update) {
      const parsed = itemUpdateSchema.parse(update);
      const [item] = await db
        .update(knowledgeItems)
        .set(parsed)
        .where(eq(knowledgeItems.id, id))
        .returning(itemColumns);
      return item ?? null;
    },

    async listLinks(filter = {}) {
      return db
        .select()
        .from(knowledgeLinks)
        .where(
          and(
            filter.itemId
              ? or(
                  eq(knowledgeLinks.fromId, filter.itemId),
                  eq(knowledgeLinks.toId, filter.itemId),
                )
              : undefined,
            filter.type ? eq(knowledgeLinks.type, filter.type) : undefined,
            filter.status
              ? eq(knowledgeLinks.status, filter.status)
              : undefined,
          ),
        )
        .orderBy(asc(knowledgeLinks.id));
    },

    async createLink(input) {
      const parsed = newLinkSchema.parse(input);
      const confirmed = parsed.status === "confirmed";
      const [link] = await db
        .insert(knowledgeLinks)
        .values({
          ...parsed,
          id: newId("link"),
          createdAt: now(),
          resolvedBy: confirmed ? parsed.createdBy : null,
          resolvedAt: confirmed ? now() : null,
        })
        .returning();
      if (!link) {
        throw new Error("Could not create the link.");
      }
      return link;
    },

    async resolveLink(id, status, resolvedBy) {
      const [link] = await db
        .update(knowledgeLinks)
        .set({ status, resolvedBy, resolvedAt: now() })
        .where(eq(knowledgeLinks.id, id))
        .returning();
      return link ?? null;
    },

    async listReviewItems(filter = {}) {
      return db
        .select()
        .from(reviewItems)
        .where(
          and(
            filter.assigneeId
              ? eq(reviewItems.assigneeId, filter.assigneeId)
              : undefined,
            filter.assigneeTeamId
              ? eq(reviewItems.assigneeTeamId, filter.assigneeTeamId)
              : undefined,
            filter.itemId
              ? arrayContains(reviewItems.itemIds, [filter.itemId])
              : undefined,
            filter.kind ? eq(reviewItems.kind, filter.kind) : undefined,
            filter.status ? eq(reviewItems.status, filter.status) : undefined,
          ),
        )
        .orderBy(desc(reviewItems.createdAt), asc(reviewItems.id));
    },

    async getReviewItem(id) {
      const [review] = await db
        .select()
        .from(reviewItems)
        .where(eq(reviewItems.id, id));
      return review ?? null;
    },

    async createReviewItem(input) {
      const parsed = newReviewItemSchema.parse(input);
      const [review] = await db
        .insert(reviewItems)
        .values({
          ...parsed,
          id: newId("rev"),
          status: "open",
          outcome: null,
          createdAt: now(),
        })
        .returning();
      if (!review) {
        throw new Error("Could not create the review item.");
      }
      return review;
    },

    async resolveReviewItem(id, outcome, resolvedBy) {
      const [review] = await db
        .update(reviewItems)
        .set({ status: "done", outcome, resolvedBy, resolvedAt: now() })
        .where(and(eq(reviewItems.id, id), eq(reviewItems.status, "open")))
        .returning();
      return review ?? null;
    },

    async listAgentQueries() {
      return db.select().from(agentQueries).orderBy(asc(agentQueries.askedAt));
    },

    async isSeeded() {
      const [row] = await db
        .select({ id: knowledgeItems.id })
        .from(knowledgeItems)
        .limit(1);
      return row !== undefined;
    },

    async reset() {
      const seed = buildCorpusSeed();

      await db.transaction(async (tx) => {
        await tx.delete(reviewItems);
        await tx.delete(knowledgeLinks);
        await tx.delete(knowledgeItems);
        await tx.delete(agentQueries);
        await tx.delete(customers);
        await tx.delete(colleagues);
        await tx.delete(teams);

        await tx.insert(teams).values(seed.teams);
        await tx.insert(colleagues).values(seed.colleagues);
        await tx.insert(customers).values(seed.customers);
        await tx.insert(knowledgeItems).values(seed.items);
        await tx.insert(knowledgeLinks).values(seed.links);
        await tx.insert(reviewItems).values(seed.reviewItems);
        await tx.insert(agentQueries).values(seed.agentQueries);
      });
    },
  };
}
