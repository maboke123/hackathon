import { documentTypeLabels } from "../labels";
import type {
  Colleague,
  Customer,
  GraphEdge,
  GraphNode,
  KnowledgeItem,
  KnowledgeLink,
  Team,
} from "../types";

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function buildGraph(input: {
  teams: Team[];
  colleagues: Colleague[];
  customers: Customer[];
  items: KnowledgeItem[];
  links: KnowledgeLink[];
}) {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const node = (
    id: string,
    type: GraphNode["type"],
    label: string,
    props: GraphNode["props"] = {},
  ) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label, props });
    return id;
  };
  const edge = (
    fromId: string,
    toId: string,
    type: GraphEdge["type"],
    status: GraphEdge["status"] = "confirmed",
  ) => {
    const id = `${fromId}|${type}|${toId}`;
    if (!edges.has(id)) edges.set(id, { id, fromId, toId, type, status });
  };

  for (const team of input.teams) node(team.id, "team", team.name);
  for (const customer of input.customers) {
    node(customer.id, "customer", customer.name, {
      segment: customer.segment,
    });
  }
  for (const person of input.colleagues) {
    node(person.id, "colleague", person.name, {
      status: person.status,
      jobTitle: person.jobTitle,
    });
    edge(person.id, person.teamId, "member_of");
  }

  for (const item of input.items) {
    node(item.id, "item", item.title, {
      kind: item.kind,
      labelStatus: item.labelStatus,
      accessLevel: item.accessLevel,
      modifiedAt: item.modifiedAt,
      lastCheckedAt: item.lastCheckedAt,
    });
    if (item.ownerId) edge(item.id, item.ownerId, "owned_by");
    if (item.authorId) edge(item.id, item.authorId, "authored_by");
    if (item.teamId) edge(item.id, item.teamId, "maintained_by");
    if (item.customerId) edge(item.id, item.customerId, "concerns");
    if (item.country) {
      const country = node(`country-${item.country}`, "country", item.country);
      edge(item.id, country, "applies_to");
    }
    edge(
      item.id,
      node(`subject-${slug(item.subject)}`, "subject", item.subject),
      "about",
    );
    edge(
      item.id,
      node(
        `type-${item.documentType}`,
        "document_type",
        documentTypeLabels[item.documentType],
      ),
      "typed_as",
    );
    for (const teamId of item.accessTeamIds) {
      edge(item.id, teamId, "accessible_to");
    }
  }

  for (const link of input.links) {
    if (link.status === "rejected") continue;
    edge(link.fromId, link.toId, link.type, link.status);
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
