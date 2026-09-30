import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { GraphEdgeType } from "@/lib/data/types";
import { KnowledgeGraph, type VizEdge, type VizNode } from "./knowledge-graph";

export const metadata: Metadata = {
  title: "Graph",
};

const hiddenEdgeTypes: GraphEdgeType[] = [
  "typed_as",
  "accessible_to",
  "authored_by",
];

export default async function GraphPage() {
  await requireUser();
  const repository = getRepository();
  const [graphNodes, graphEdges, items, links, colleagues] = await Promise.all([
    repository.listGraphNodes(),
    repository.listGraphEdges(),
    repository.listItems(),
    repository.listLinks(),
    repository.listColleagues(),
  ]);

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const reasons = new Map(
    links.map((link) => [`${link.fromId}|${link.type}|${link.toId}`, link]),
  );
  const replaced = new Set(
    links
      .filter(
        (link) => link.type === "supersedes" && link.status === "confirmed",
      )
      .map((link) => link.toId),
  );

  const edges: VizEdge[] = graphEdges
    .filter((edge) => !hiddenEdgeTypes.includes(edge.type))
    .map((edge) => ({
      id: edge.id,
      from: edge.fromId,
      to: edge.toId,
      type: edge.type,
      suggested: edge.status === "suggested",
      reason: reasons.get(edge.id)?.reason ?? null,
    }));
  const connected = new Set(edges.flatMap((edge) => [edge.from, edge.to]));

  const nodes: VizNode[] = graphNodes
    .filter((node) => connected.has(node.id))
    .map((node) => {
      const item = itemsById.get(node.id);
      if (item) {
        const owner = item.ownerId ? people.get(item.ownerId) : null;
        return {
          id: node.id,
          type: node.type,
          label: item.title,
          kind: item.kind,
          state: replaced.has(item.id) ? "replaced" : item.status,
          owner: owner
            ? `${owner.name}${owner.status === "left" ? " (left)" : ""}`
            : null,
          subject: item.subject,
        };
      }
      const person = people.get(node.id);
      return {
        id: node.id,
        type: node.type,
        label: node.label,
        kind: null,
        state: person?.status === "left" ? "left" : "active",
        owner: null,
        subject: person?.jobTitle ?? null,
      };
    });

  return (
    <KnowledgeGraph
      nodes={nodes}
      edges={edges}
      stats={{
        sources: items.length,
        documents: items.filter((item) => item.kind === "document").length,
        links: links.filter((link) => link.status !== "rejected").length,
        people: nodes.filter((node) => node.type === "colleague").length,
      }}
    />
  );
}
