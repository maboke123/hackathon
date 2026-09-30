export type NodeKind = "document" | "record" | "person";

export type NodeStatus =
  | "current"
  | "outdated"
  | "draft"
  | "copy"
  | "scope"
  | "record"
  | "person"
  | "left";

export type Cluster = "birth" | "meal" | "index" | "admin" | "veldra";

export type LinkType =
  | "supersedes"
  | "contradicts"
  | "variant_of"
  | "duplicate_of"
  | "supports"
  | "owns";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  status: NodeStatus;
  cluster: Cluster;
  label?: string;
}

export interface GraphLink {
  from: string;
  to: string;
  type: LinkType;
}

export const clusterCenters: Record<
  Cluster,
  { x: number; y: number; label: string }
> = {
  meal: { x: 160, y: 310, label: "Meal vouchers" },
  index: { x: 190, y: 470, label: "Indexation PC 200" },
  birth: { x: 640, y: 385, label: "Birth leave, Belgium" },
  admin: { x: 990, y: 490, label: "Dimona and ecocheques" },
  veldra: { x: 980, y: 175, label: "Veldra account" },
};

const doc = (
  id: string,
  status: NodeStatus,
  cluster: Cluster,
  label?: string,
): GraphNode => ({
  id,
  kind: "document",
  status,
  cluster,
  label,
});

const rec = (id: string, cluster: Cluster, label?: string): GraphNode => ({
  id,
  kind: "record",
  status: "record",
  cluster,
  label,
});

const person = (
  id: string,
  cluster: Cluster,
  left = false,
  label?: string,
): GraphNode => ({
  id,
  kind: "person",
  status: left ? "left" : "person",
  cluster,
  label,
});

export const nodes: GraphNode[] = [
  doc("doc-01", "outdated", "birth", "Werkinstructie, 15 days"),
  doc("doc-02", "outdated", "birth", "Quick guide, 15 days"),
  doc("doc-03", "scope", "birth", "Geboorteverlof Nederland"),
  doc("doc-04", "copy", "birth", "Personal copy on OneDrive"),
  doc("doc-05", "current", "birth", "Geboorteverlof België"),
  rec("mail-01", "birth"),
  rec("mail-11", "birth"),
  rec("mail-12", "birth"),
  rec("chat-01", "birth", "Pieter in the service channel"),
  rec("call-01", "birth"),
  rec("call-04", "birth"),
  rec("ticket-02", "birth", "Ticket, told 15 days"),
  person("p-pieter", "birth", false, "Pieter De Smedt, owner"),
  person("p-annick", "birth", true, "Annick Wouters, left"),
  person("p-sanne", "birth"),

  doc("doc-06", "outdated", "meal"),
  doc("doc-07", "current", "meal"),
  rec("mail-04", "meal"),
  rec("call-02", "meal"),

  doc("doc-08", "outdated", "index"),
  doc("doc-15", "draft", "index"),
  rec("mail-05", "index"),
  rec("chat-03", "index"),
  rec("call-03", "index"),
  doc("doc-09", "current", "index"),
  person("p-claire", "index"),

  doc("doc-10", "current", "admin"),
  doc("doc-11", "current", "admin"),
  doc("doc-12", "copy", "admin"),
  doc("doc-13", "draft", "index"),
  rec("mail-03", "admin"),
  rec("meet-04", "admin"),
  person("p-bram", "admin"),

  doc("doc-14", "outdated", "veldra"),
  doc("doc-16", "outdated", "veldra"),
  doc("doc-17", "outdated", "veldra"),
  doc("doc-18", "current", "veldra"),
  doc("doc-19", "outdated", "veldra"),
  doc("doc-20", "outdated", "veldra"),
  doc("doc-21", "draft", "veldra"),
  doc("doc-22", "current", "veldra"),
  rec("mail-02", "veldra"),
  rec("mail-06", "veldra"),
  rec("mail-07", "veldra"),
  rec("mail-08", "veldra"),
  rec("mail-09", "veldra"),
  rec("mail-10", "veldra"),
  rec("meet-01", "veldra"),
  rec("meet-02", "veldra"),
  rec("meet-03", "veldra"),
  rec("chat-02", "veldra"),
  rec("chat-04", "veldra"),
  rec("chat-05", "veldra"),
  rec("call-05", "veldra"),
  person("p-jonas", "veldra"),
  person("p-hilde", "veldra", true),
  person("p-katrin", "veldra"),
  person("p-marta", "veldra"),
  person("p-nadia", "veldra"),
  person("p-elif", "veldra"),
];

export const links: GraphLink[] = [
  { from: "doc-05", to: "doc-01", type: "supersedes" },
  { from: "doc-05", to: "doc-02", type: "supersedes" },
  { from: "doc-03", to: "doc-05", type: "variant_of" },
  { from: "doc-04", to: "doc-05", type: "duplicate_of" },
  { from: "chat-01", to: "doc-05", type: "supports" },
  { from: "mail-01", to: "doc-04", type: "supports" },
  { from: "mail-12", to: "doc-05", type: "supports" },
  { from: "ticket-02", to: "doc-05", type: "contradicts" },
  { from: "mail-11", to: "doc-01", type: "supports" },
  { from: "call-01", to: "ticket-02", type: "supports" },
  { from: "call-04", to: "doc-03", type: "supports" },
  { from: "p-pieter", to: "doc-05", type: "owns" },
  { from: "p-annick", to: "doc-02", type: "owns" },
  { from: "p-sanne", to: "doc-03", type: "owns" },

  { from: "doc-07", to: "doc-06", type: "supersedes" },
  { from: "mail-04", to: "doc-07", type: "supports" },
  { from: "call-02", to: "doc-07", type: "contradicts" },
  { from: "p-pieter", to: "doc-07", type: "owns" },

  { from: "mail-05", to: "doc-08", type: "contradicts" },
  { from: "mail-05", to: "doc-15", type: "contradicts" },
  { from: "chat-03", to: "mail-05", type: "supports" },
  { from: "call-03", to: "doc-08", type: "supports" },
  { from: "p-pieter", to: "doc-08", type: "owns" },
  { from: "p-pieter", to: "doc-09", type: "owns" },
  { from: "p-claire", to: "doc-15", type: "owns" },
  { from: "p-claire", to: "doc-13", type: "owns" },

  { from: "doc-12", to: "doc-11", type: "duplicate_of" },
  { from: "p-bram", to: "doc-11", type: "owns" },
  { from: "p-bram", to: "doc-10", type: "owns" },
  { from: "mail-03", to: "doc-11", type: "supports" },
  { from: "meet-04", to: "doc-11", type: "supports" },

  { from: "doc-18", to: "doc-16", type: "supersedes" },
  { from: "mail-06", to: "doc-18", type: "contradicts" },
  { from: "doc-17", to: "doc-18", type: "contradicts" },
  { from: "mail-02", to: "doc-19", type: "contradicts" },
  { from: "chat-02", to: "doc-20", type: "contradicts" },
  { from: "chat-04", to: "doc-21", type: "contradicts" },
  { from: "meet-01", to: "doc-18", type: "supports" },
  { from: "meet-03", to: "doc-18", type: "supports" },
  { from: "mail-09", to: "doc-18", type: "supports" },
  { from: "meet-02", to: "mail-02", type: "supports" },
  { from: "mail-08", to: "mail-02", type: "supports" },
  { from: "mail-07", to: "meet-03", type: "supports" },
  { from: "mail-10", to: "p-elif", type: "supports" },
  { from: "chat-05", to: "p-elif", type: "supports" },
  { from: "call-05", to: "doc-19", type: "supports" },
  { from: "doc-21", to: "doc-18", type: "supports" },
  { from: "doc-22", to: "doc-18", type: "variant_of" },
  { from: "doc-14", to: "p-elif", type: "supports" },
  { from: "p-jonas", to: "doc-18", type: "owns" },
  { from: "p-jonas", to: "doc-21", type: "owns" },
  { from: "p-hilde", to: "doc-16", type: "owns" },
  { from: "p-katrin", to: "doc-19", type: "owns" },
  { from: "p-marta", to: "doc-20", type: "owns" },
  { from: "p-nadia", to: "doc-22", type: "owns" },
  { from: "meet-03", to: "p-elif", type: "supports" },
];

export const focusIds = new Set([
  "doc-01",
  "doc-02",
  "doc-03",
  "doc-04",
  "doc-05",
  "chat-01",
  "ticket-02",
  "p-pieter",
  "p-annick",
  "p-sanne",
]);

export const focusLayout: Record<string, { angle: number; distance: number }> =
  {
    "doc-05": { angle: 0, distance: 0 },
    "doc-04": { angle: 10, distance: 140 },
    "chat-01": { angle: 62, distance: 125 },
    "p-pieter": { angle: 100, distance: 118 },
    "doc-02": { angle: 170, distance: 140 },
    "p-annick": { angle: 150, distance: 215 },
    "doc-01": { angle: 212, distance: 140 },
    "ticket-02": { angle: 268, distance: 125 },
    "doc-03": { angle: 322, distance: 140 },
    "p-sanne": { angle: 318, distance: 215 },
  };

export const linkLegend: { type: LinkType; label: string }[] = [
  { type: "supersedes", label: "Replaces" },
  { type: "contradicts", label: "Contradicts" },
  { type: "variant_of", label: "Other scope" },
  { type: "duplicate_of", label: "Copy of" },
  { type: "supports", label: "Confirms" },
  { type: "owns", label: "Owner" },
];
