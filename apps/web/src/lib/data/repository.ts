import type {
  AgentQuery,
  Colleague,
  Customer,
  ItemKind,
  ItemStatus,
  ItemUpdate,
  KnowledgeItem,
  KnowledgeLink,
  LinkStatus,
  LinkType,
  NewLink,
  NewReviewItem,
  ReviewItem,
  ReviewKind,
  ReviewStatus,
  Team,
} from "./types";

export type ItemFilter = {
  kind?: ItemKind;
  status?: ItemStatus;
  country?: string;
  customerId?: string;
  teamId?: string;
  ownerId?: string;
};

export type SearchResult = {
  item: KnowledgeItem;
  rank: number;
};

export type ItemEmbedding = {
  id: string;
  embedding: number[];
};

export type LinkFilter = {
  itemId?: string;
  type?: LinkType;
  status?: LinkStatus;
};

export type ReviewFilter = {
  assigneeId?: string;
  assigneeTeamId?: string;
  itemId?: string;
  kind?: ReviewKind;
  status?: ReviewStatus;
};

export interface DataRepository {
  listTeams(): Promise<Team[]>;
  listColleagues(): Promise<Colleague[]>;
  getColleague(id: string): Promise<Colleague | null>;
  getColleagueByEmail(email: string): Promise<Colleague | null>;
  listCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;

  listItems(filter?: ItemFilter): Promise<KnowledgeItem[]>;
  getItem(id: string): Promise<KnowledgeItem | null>;
  searchItems(query: string, filter?: ItemFilter): Promise<SearchResult[]>;
  updateItem(id: string, update: ItemUpdate): Promise<KnowledgeItem | null>;
  listEmbeddings(): Promise<ItemEmbedding[]>;
  listItemsWithoutEmbedding(): Promise<KnowledgeItem[]>;
  setEmbedding(id: string, embedding: number[]): Promise<void>;

  /** Links where the item is on either side. */
  listLinks(filter?: LinkFilter): Promise<KnowledgeLink[]>;
  createLink(input: NewLink): Promise<KnowledgeLink>;
  resolveLink(
    id: string,
    status: Exclude<LinkStatus, "suggested">,
    resolvedBy: string,
  ): Promise<KnowledgeLink | null>;

  listReviewItems(filter?: ReviewFilter): Promise<ReviewItem[]>;
  getReviewItem(id: string): Promise<ReviewItem | null>;
  createReviewItem(input: NewReviewItem): Promise<ReviewItem>;
  resolveReviewItem(
    id: string,
    outcome: string,
    resolvedBy: string,
  ): Promise<ReviewItem | null>;

  listAgentQueries(): Promise<AgentQuery[]>;

  isSeeded(): Promise<boolean>;
  reset(): Promise<void>;
}
