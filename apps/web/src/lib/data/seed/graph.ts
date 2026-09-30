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

export const ITEM_EDGE_TYPES = [
  "about",
  "typed_as",
  "owned_by",
  "authored_by",
  "maintained_by",
  "concerns",
  "applies_to",
  "accessible_to",
] as const;

type GraphParts = { nodes: GraphNode[]; edges: GraphEdge[] };

export const linkEdge = (link: KnowledgeLink): GraphEdge => ({
  id: `${link.fromId}|${link.type}|${link.toId}`,
  fromId: link.fromId,
  toId: link.toId,
  type: link.type,
  status: link.status,
});

export function itemGraph(item: KnowledgeItem): GraphParts {
  const nodes: GraphNode[] = [
    {
      id: item.id,
      type: "item",
      label: item.title,
      props: {
        kind: item.kind,
        labelStatus: item.labelStatus,
        accessLevel: item.accessLevel,
        modifiedAt: item.modifiedAt,
        lastCheckedAt: item.lastCheckedAt,
      },
    },
    {
      id: `subject-${slug(item.subject)}`,
      type: "subject",
      label: item.subject,
      props: {},
    },
    {
      id: `type-${item.documentType}`,
      type: "document_type",
      label: documentTypeLabels[item.documentType],
      props: {},
    },
  ];
  const targets: [string, GraphEdge["type"]][] = [
    [`subject-${slug(item.subject)}`, "about"],
    [`type-${item.documentType}`, "typed_as"],
  ];
  if (item.ownerId) targets.push([item.ownerId, "owned_by"]);
  if (item.authorId) targets.push([item.authorId, "authored_by"]);
  if (item.teamId) targets.push([item.teamId, "maintained_by"]);
  if (item.customerId) targets.push([item.customerId, "concerns"]);
  if (item.country) {
    nodes.push({
      id: `country-${item.country}`,
      type: "country",
      label: item.country,
      props: {},
    });
    targets.push([`country-${item.country}`, "applies_to"]);
  }
  for (const teamId of item.accessTeamIds) {
    targets.push([teamId, "accessible_to"]);
  }
  return {
    nodes,
    edges: targets.map(([toId, type]) => ({
      id: `${item.id}|${type}|${toId}`,
      fromId: item.id,
      toId,
      type,
      status: "confirmed" as const,
    })),
  };
}

export function buildGraph(input: {
  teams: Team[];
  colleagues: Colleague[];
  customers: Customer[];
  items: KnowledgeItem[];
  links: KnowledgeLink[];
}): GraphParts {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const add = (parts: GraphParts) => {
    for (const node of parts.nodes)
      if (!nodes.has(node.id)) nodes.set(node.id, node);
    for (const edge of parts.edges)
      if (!edges.has(edge.id)) edges.set(edge.id, edge);
  };

  for (const team of input.teams) {
    add({
      nodes: [{ id: team.id, type: "team", label: team.name, props: {} }],
      edges: [],
    });
  }
  for (const customer of input.customers) {
    add({
      nodes: [
        {
          id: customer.id,
          type: "customer",
          label: customer.name,
          props: { segment: customer.segment },
        },
      ],
      edges: [],
    });
  }
  for (const person of input.colleagues) {
    add({
      nodes: [
        {
          id: person.id,
          type: "colleague",
          label: person.name,
          props: { status: person.status, jobTitle: person.jobTitle },
        },
      ],
      edges: [
        {
          id: `${person.id}|member_of|${person.teamId}`,
          fromId: person.id,
          toId: person.teamId,
          type: "member_of",
          status: "confirmed",
        },
      ],
    });
  }
  for (const item of input.items) add(itemGraph(item));
  for (const link of input.links) {
    if (link.status !== "rejected") add({ nodes: [], edges: [linkEdge(link)] });
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
